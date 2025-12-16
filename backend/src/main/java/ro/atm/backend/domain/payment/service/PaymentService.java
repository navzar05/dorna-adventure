package ro.atm.backend.domain.payment.service;

import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.domain.payment.dto.PaymentDTO;
import ro.atm.backend.domain.payment.dto.PaymentIntentRequest;
import ro.atm.backend.domain.payment.dto.PaymentIntentResponse;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.payment.entity.Payment;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.payment.repository.PaymentRepository;
import ro.atm.backend.common.exception.BookingNotFoundException;
import ro.atm.backend.common.exception.PaymentException;
import ro.atm.backend.common.exception.ValidationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service responsible for payment business logic.
 * Delegates Stripe-specific operations to StripePaymentService.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final StripePaymentService stripePaymentService;

    /**
     * Creates a payment intent for a booking.
     * This method handles business logic and delegates Stripe API calls to StripePaymentService.
     *
     * @param request The payment intent request containing booking and payment details
     * @return PaymentIntentResponse with client secret and payment details
     */
    @Transactional
    public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException(request.getBookingId()));

        // Calculate amount based on payment type
        BigDecimal amount = calculatePaymentAmount(booking, request.getPaymentType());

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Invalid payment amount");
        }

        // Delegate Stripe API call to StripePaymentService
        PaymentIntent paymentIntent = stripePaymentService.createPaymentIntent(booking, amount);

        // Save payment record
        Payment payment = Payment.builder()
                .booking(booking)
                .amount(amount)
                .paymentType(convertPaymentType(request.getPaymentType()))
                .paymentMethod(Payment.PaymentMethod.CARD)
                .status(Payment.PaymentStatus.PENDING)
                .stripePaymentIntentId(paymentIntent.getId())
                .stripeClientSecret(paymentIntent.getClientSecret())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        return PaymentIntentResponse.builder()
                .clientSecret(paymentIntent.getClientSecret())
                .paymentId(savedPayment.getId())
                .paymentIntentId(paymentIntent.getId())
                .build();
    }

    /**
     * Calculates the payment amount based on the payment type.
     *
     * @param booking The booking for which to calculate the payment
     * @param paymentType The type of payment (DEPOSIT, REMAINING, FULL)
     * @return The calculated payment amount
     */
    private BigDecimal calculatePaymentAmount(Booking booking, PaymentIntentRequest.PaymentType paymentType) {
        switch (paymentType) {
            case DEPOSIT:
                return booking.getDepositPaid();
            case REMAINING:
                return booking.getRemainingAmount();
            case FULL:
                return booking.getTotalPrice();
            default:
                throw new ValidationException("Invalid payment type");
        }
    }

    /**
     * Converts PaymentIntentRequest.PaymentType to Payment.PaymentType.
     *
     * @param type The payment type from the request
     * @return The corresponding Payment.PaymentType enum
     */
    private Payment.PaymentType convertPaymentType(PaymentIntentRequest.PaymentType type) {
        switch (type) {
            case DEPOSIT: return Payment.PaymentType.DEPOSIT;
            case REMAINING: return Payment.PaymentType.REMAINING;
            case FULL: return Payment.PaymentType.FULL;
            default: throw new ValidationException("Invalid payment type");
        }
    }

    /**
     * Handles successful payment by updating payment and booking status.
     *
     * @param paymentIntentId The Stripe PaymentIntent ID
     */
    @Transactional
    public void handlePaymentSuccess(String paymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new PaymentException("Payment not found for PaymentIntent: " + paymentIntentId));

        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        payment.setCompletedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setPaidAmount(booking.getPaidAmount().add(payment.getAmount()));
        booking.calculateRemainingAmount();

        if (booking.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0) {
            booking.setPaymentStatus(Booking.PaymentStatus.FULLY_PAID);
        } else if (booking.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            booking.setPaymentStatus(Booking.PaymentStatus.DEPOSIT_PAID);
        }

        if (booking.getStatus() == Booking.BookingStatus.PENDING &&
                booking.getPaymentStatus() != Booking.PaymentStatus.UNPAID) {
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
        }

        bookingRepository.save(booking);
    }

    /**
     * Handles failed payment by updating payment status.
     *
     * @param paymentIntentId The Stripe PaymentIntent ID
     * @param failureReason The reason for the payment failure
     */
    @Transactional
    public void handlePaymentFailure(String paymentIntentId, String failureReason) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new PaymentException("Payment not found for PaymentIntent: " + paymentIntentId));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);
    }

    /**
     * Retrieves all payments for a specific booking.
     *
     * @param bookingId The ID of the booking
     * @return List of PaymentDTO objects
     */
    public List<PaymentDTO> getBookingPayments(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId).stream()
                .map(PaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Marks that the remaining amount for a booking will be paid in cash.
     *
     * @param bookingId The ID of the booking
     */
    @Transactional
    public void markRemainingAsCash(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        booking.setWillPayRemainingCash(true);
        bookingRepository.save(booking);
    }

    /**
     * Records a cash payment for the remaining amount of a booking.
     *
     * @param bookingId The ID of the booking
     */
    @Transactional
    public void recordCashPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getRemainingAmount())
                .paymentType(Payment.PaymentType.REMAINING)
                .paymentMethod(Payment.PaymentMethod.CASH)
                .status(Payment.PaymentStatus.COMPLETED)
                .completedAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        booking.setPaidAmount(booking.getTotalPrice());
        booking.setRemainingAmount(BigDecimal.ZERO);
        booking.setPaymentStatus(Booking.PaymentStatus.FULLY_PAID);
        bookingRepository.save(booking);
    }
}
