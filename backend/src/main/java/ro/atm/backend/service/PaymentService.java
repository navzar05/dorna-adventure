// src/main/java/ro/atm/backend/service/PaymentService.java
package ro.atm.backend.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.dto.PaymentDTO;
import ro.atm.backend.dto.PaymentIntentRequest;
import ro.atm.backend.dto.PaymentIntentResponse;
import ro.atm.backend.entity.Booking;
import ro.atm.backend.entity.Payment;
import ro.atm.backend.repo.BookingRepository;
import ro.atm.backend.repo.PaymentRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Value("${stripe.currency}")
    private String currency;

    @Transactional
    public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request) throws StripeException {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Calculate amount based on payment type
        BigDecimal amount = calculatePaymentAmount(booking, request.getPaymentType());

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid payment amount");
        }

        // Create Stripe PaymentIntent
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount.multiply(BigDecimal.valueOf(100)).longValue()) // Convert to cents
                .setCurrency(currency)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .putMetadata("bookingId", booking.getId().toString())
                .putMetadata("activityName", booking.getActivity().getName())
                .putMetadata("userName", booking.getUser().getFirstName() + " " + booking.getUser().getLastName())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

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

    private BigDecimal calculatePaymentAmount(Booking booking, PaymentIntentRequest.PaymentType paymentType) {
        switch (paymentType) {
            case DEPOSIT:
                return booking.getDepositPaid();
            case REMAINING:
                return booking.getRemainingAmount();
            case FULL:
                return booking.getTotalPrice();
            default:
                throw new RuntimeException("Invalid payment type");
        }
    }

    private Payment.PaymentType convertPaymentType(PaymentIntentRequest.PaymentType type) {
        switch (type) {
            case DEPOSIT: return Payment.PaymentType.DEPOSIT;
            case REMAINING: return Payment.PaymentType.REMAINING;
            case FULL: return Payment.PaymentType.FULL;
            default: throw new RuntimeException("Invalid payment type");
        }
    }

    @Transactional
    public void handlePaymentSuccess(String paymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

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

    @Transactional
    public void handlePaymentFailure(String paymentIntentId, String failureReason) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);
    }

    public List<PaymentDTO> getBookingPayments(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId).stream()
                .map(PaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markRemainingAsCash(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setWillPayRemainingCash(true);
        bookingRepository.save(booking);
    }

    @Transactional
    public void recordCashPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

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