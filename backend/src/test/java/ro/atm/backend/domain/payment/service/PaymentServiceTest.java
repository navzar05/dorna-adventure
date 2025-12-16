package ro.atm.backend.domain.payment.service;

import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.payment.dto.PaymentIntentRequest;
import ro.atm.backend.domain.payment.dto.PaymentIntentResponse;
import ro.atm.backend.domain.payment.entity.Payment;
import ro.atm.backend.domain.payment.repository.PaymentRepository;
import ro.atm.backend.common.exception.BookingNotFoundException;
import ro.atm.backend.common.exception.PaymentException;
import ro.atm.backend.common.exception.ValidationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PaymentService.
 * Demonstrates testing patterns for complex business logic with external service dependencies.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Tests")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private StripePaymentService stripePaymentService;

    @InjectMocks
    private PaymentService paymentService;

    private Booking booking;
    private PaymentIntent paymentIntent;
    private Payment payment;

    @BeforeEach
    void setUp() {
        // Setup test booking
        booking = new Booking();
        booking.setId(1L);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setPaymentStatus(Booking.PaymentStatus.UNPAID);
        booking.setTotalPrice(new BigDecimal("500.00"));
        booking.setPaidAmount(new BigDecimal("0.00"));
        booking.setRemainingAmount(new BigDecimal("500.00"));
        booking.setDepositPaid(new BigDecimal("100.00"));

        // Setup mock PaymentIntent
        paymentIntent = new PaymentIntent();
        paymentIntent.setId("pi_test123");
        paymentIntent.setClientSecret("pi_test123_secret_abc");

        // Setup test payment
        payment = Payment.builder()
                .id(1L)
                .booking(booking)
                .amount(new BigDecimal("100.00"))
                .paymentType(Payment.PaymentType.DEPOSIT)
                .paymentMethod(Payment.PaymentMethod.CARD)
                .status(Payment.PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_test123")
                .stripeClientSecret("pi_test123_secret_abc")
                .build();
    }

    @Test
    @DisplayName("Should create payment intent for deposit payment")
    void testCreatePaymentIntent_Deposit() {
        // Given
        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setBookingId(1L);
        request.setPaymentType(PaymentIntentRequest.PaymentType.DEPOSIT);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(stripePaymentService.createPaymentIntent(eq(booking), any(BigDecimal.class)))
                .thenReturn(paymentIntent);
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        // When
        PaymentIntentResponse response = paymentService.createPaymentIntent(request);

        // Then
        assertNotNull(response);
        assertEquals("pi_test123_secret_abc", response.getClientSecret());
        assertEquals("pi_test123", response.getPaymentIntentId());
        assertNotNull(response.getPaymentId());

        verify(bookingRepository, times(1)).findById(1L);
        verify(stripePaymentService, times(1)).createPaymentIntent(eq(booking), eq(new BigDecimal("100.00")));
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("Should create payment intent for full payment")
    void testCreatePaymentIntent_Full() {
        // Given
        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setBookingId(1L);
        request.setPaymentType(PaymentIntentRequest.PaymentType.FULL);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(stripePaymentService.createPaymentIntent(eq(booking), any(BigDecimal.class)))
                .thenReturn(paymentIntent);
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        // When
        PaymentIntentResponse response = paymentService.createPaymentIntent(request);

        // Then
        assertNotNull(response);
        verify(stripePaymentService, times(1)).createPaymentIntent(eq(booking), eq(new BigDecimal("500.00")));
    }

    @Test
    @DisplayName("Should throw BookingNotFoundException when booking does not exist")
    void testCreatePaymentIntent_BookingNotFound() {
        // Given
        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setBookingId(999L);
        request.setPaymentType(PaymentIntentRequest.PaymentType.DEPOSIT);

        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(BookingNotFoundException.class, () ->
            paymentService.createPaymentIntent(request)
        );

        verify(bookingRepository, times(1)).findById(999L);
        verify(stripePaymentService, never()).createPaymentIntent(any(), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw ValidationException when payment amount is zero or negative")
    void testCreatePaymentIntent_InvalidAmount() {
        // Given
        booking.setRemainingAmount(BigDecimal.ZERO);
        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setBookingId(1L);
        request.setPaymentType(PaymentIntentRequest.PaymentType.REMAINING);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When & Then
        assertThrows(ValidationException.class, () ->
            paymentService.createPaymentIntent(request)
        );

        verify(stripePaymentService, never()).createPaymentIntent(any(), any());
    }

    @Test
    @DisplayName("Should handle payment success and update booking status")
    void testHandlePaymentSuccess_DepositPayment() {
        // Given
        String paymentIntentId = "pi_test123";
        payment.setStatus(Payment.PaymentStatus.PENDING);

        when(paymentRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        paymentService.handlePaymentSuccess(paymentIntentId);

        // Then
        verify(paymentRepository, times(1)).findByStripePaymentIntentId(paymentIntentId);
        verify(paymentRepository, times(1)).save(argThat(p ->
            p.getStatus() == Payment.PaymentStatus.COMPLETED &&
            p.getCompletedAt() != null
        ));
        verify(bookingRepository, times(1)).save(argThat(b ->
            b.getPaidAmount().compareTo(new BigDecimal("100.00")) == 0 &&
            b.getPaymentStatus() == Booking.PaymentStatus.DEPOSIT_PAID &&
            b.getStatus() == Booking.BookingStatus.CONFIRMED
        ));
    }

    @Test
    @DisplayName("Should handle payment success and mark as fully paid when remaining is zero")
    void testHandlePaymentSuccess_FullPayment() {
        // Given
        String paymentIntentId = "pi_test123";
        payment.setAmount(new BigDecimal("500.00"));
        booking.setRemainingAmount(new BigDecimal("500.00"));

        when(paymentRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        paymentService.handlePaymentSuccess(paymentIntentId);

        // Then
        verify(bookingRepository, times(1)).save(argThat(b ->
            b.getPaymentStatus() == Booking.PaymentStatus.FULLY_PAID
        ));
    }

    @Test
    @DisplayName("Should throw PaymentException when payment not found for success handling")
    void testHandlePaymentSuccess_PaymentNotFound() {
        // Given
        String paymentIntentId = "pi_nonexistent";
        when(paymentRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.empty());

        // When & Then
        PaymentException exception = assertThrows(PaymentException.class, () ->
            paymentService.handlePaymentSuccess(paymentIntentId)
        );

        assertTrue(exception.getMessage().contains(paymentIntentId));
        verify(paymentRepository, times(1)).findByStripePaymentIntentId(paymentIntentId);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should handle payment failure and update payment status")
    void testHandlePaymentFailure() {
        // Given
        String paymentIntentId = "pi_test123";
        String failureReason = "Insufficient funds";

        when(paymentRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        // When
        paymentService.handlePaymentFailure(paymentIntentId, failureReason);

        // Then
        verify(paymentRepository, times(1)).findByStripePaymentIntentId(paymentIntentId);
        verify(paymentRepository, times(1)).save(argThat(p ->
            p.getStatus() == Payment.PaymentStatus.FAILED &&
            failureReason.equals(p.getFailureReason())
        ));
    }

    @Test
    @DisplayName("Should mark remaining amount as cash")
    void testMarkRemainingAsCash() {
        // Given
        Long bookingId = 1L;
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        paymentService.markRemainingAsCash(bookingId);

        // Then
        verify(bookingRepository, times(1)).findById(bookingId);
        verify(bookingRepository, times(1)).save(argThat(b ->
            b.getWillPayRemainingCash() == true
        ));
    }

    @Test
    @DisplayName("Should record cash payment and update booking to fully paid")
    void testRecordCashPayment() {
        // Given
        Long bookingId = 1L;
        booking.setRemainingAmount(new BigDecimal("400.00"));

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        paymentService.recordCashPayment(bookingId);

        // Then
        verify(bookingRepository, times(1)).findById(bookingId);
        verify(paymentRepository, times(1)).save(argThat(p ->
            p.getPaymentMethod() == Payment.PaymentMethod.CASH &&
            p.getStatus() == Payment.PaymentStatus.COMPLETED &&
            p.getAmount().compareTo(new BigDecimal("400.00")) == 0
        ));
        verify(bookingRepository, times(1)).save(argThat(b ->
            b.getPaymentStatus() == Booking.PaymentStatus.FULLY_PAID &&
            b.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0
        ));
    }

    @Test
    @DisplayName("Should throw exception when booking not found for cash payment")
    void testRecordCashPayment_BookingNotFound() {
        // Given
        Long bookingId = 999L;
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(BookingNotFoundException.class, () ->
            paymentService.recordCashPayment(bookingId)
        );

        verify(paymentRepository, never()).save(any());
    }
}
