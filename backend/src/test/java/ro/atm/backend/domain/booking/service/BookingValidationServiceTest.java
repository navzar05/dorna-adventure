package ro.atm.backend.domain.booking.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BookingValidationService.
 * Demonstrates testing patterns for validation logic using JUnit 5 and Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BookingValidationService Tests")
class BookingValidationServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private BookingValidationService bookingValidationService;

    private Activity activity;
    private Booking booking;

    @BeforeEach
    void setUp() {
        // Setup test data
        activity = new Activity();
        activity.setId(1L);
        activity.setName("Mountain Hiking");
        activity.setMinParticipants(2);
        activity.setMaxParticipants(10);

        booking = new Booking();
        booking.setId(1L);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setPaymentStatus(Booking.PaymentStatus.DEPOSIT_PAID);
        booking.setTotalPrice(new BigDecimal("500.00"));
        booking.setPaidAmount(new BigDecimal("100.00"));
        booking.setRemainingAmount(new BigDecimal("400.00"));
        booking.setPaymentDeadline(LocalDateTime.now().plusDays(7));
    }

    @Test
    @DisplayName("Should validate participant count within range")
    void testValidateParticipantCount_Valid() {
        // Given
        int validParticipantCount = 5;

        // When & Then - Should not throw exception
        assertDoesNotThrow(() ->
            bookingValidationService.validateParticipantCount(activity, validParticipantCount)
        );
    }

    @Test
    @DisplayName("Should throw exception when participant count below minimum")
    void testValidateParticipantCount_BelowMinimum() {
        // Given
        int invalidParticipantCount = 1;

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            bookingValidationService.validateParticipantCount(activity, invalidParticipantCount)
        );

        assertTrue(exception.getMessage().contains("Invalid number of participants"));
        assertTrue(exception.getMessage().contains("between 2 and 10"));
    }

    @Test
    @DisplayName("Should throw exception when participant count exceeds maximum")
    void testValidateParticipantCount_AboveMaximum() {
        // Given
        int invalidParticipantCount = 15;

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            bookingValidationService.validateParticipantCount(activity, invalidParticipantCount)
        );

        assertTrue(exception.getMessage().contains("Invalid number of participants"));
    }

    @Test
    @DisplayName("Should validate guest booking data with valid inputs")
    void testValidateGuestBookingData_Valid() {
        // Given
        String guestName = "John Doe";
        String guestPhone = "+1234567890";

        // When & Then - Should not throw exception
        assertDoesNotThrow(() ->
            bookingValidationService.validateGuestBookingData(guestName, guestPhone)
        );
    }

    @Test
    @DisplayName("Should throw exception when guest name is null")
    void testValidateGuestBookingData_NullName() {
        // Given
        String guestName = null;
        String guestPhone = "+1234567890";

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            bookingValidationService.validateGuestBookingData(guestName, guestPhone)
        );

        assertEquals("Guest name is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when guest name is empty")
    void testValidateGuestBookingData_EmptyName() {
        // Given
        String guestName = "   ";
        String guestPhone = "+1234567890";

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            bookingValidationService.validateGuestBookingData(guestName, guestPhone)
        );

        assertEquals("Guest name is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when guest phone is null")
    void testValidateGuestBookingData_NullPhone() {
        // Given
        String guestName = "John Doe";
        String guestPhone = null;

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            bookingValidationService.validateGuestBookingData(guestName, guestPhone)
        );

        assertEquals("Guest phone is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should accept payment when booking is confirmed and not fully paid")
    void testCanAcceptPayment_Valid() {
        // Given
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When
        boolean canAcceptPayment = bookingValidationService.canAcceptPayment(1L);

        // Then
        assertTrue(canAcceptPayment);
        verify(bookingRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should not accept payment when booking is not confirmed")
    void testCanAcceptPayment_NotConfirmed() {
        // Given
        booking.setStatus(Booking.BookingStatus.PENDING);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When
        boolean canAcceptPayment = bookingValidationService.canAcceptPayment(1L);

        // Then
        assertFalse(canAcceptPayment);
    }

    @Test
    @DisplayName("Should not accept payment when deadline has passed")
    void testCanAcceptPayment_DeadlinePassed() {
        // Given
        booking.setPaymentDeadline(LocalDateTime.now().minusDays(1));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When
        boolean canAcceptPayment = bookingValidationService.canAcceptPayment(1L);

        // Then
        assertFalse(canAcceptPayment);
    }

    @Test
    @DisplayName("Should not accept payment when booking is fully paid")
    void testCanAcceptPayment_FullyPaid() {
        // Given
        booking.setPaymentStatus(Booking.PaymentStatus.FULLY_PAID);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When
        boolean canAcceptPayment = bookingValidationService.canAcceptPayment(1L);

        // Then
        assertFalse(canAcceptPayment);
    }

    @Test
    @DisplayName("Should throw exception when booking not found")
    void testCanAcceptPayment_BookingNotFound() {
        // Given
        when(bookingRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () ->
            bookingValidationService.canAcceptPayment(999L)
        );
    }

    @Test
    @DisplayName("Should validate status transition without throwing exception")
    void testValidateStatusTransition() {
        // Given
        Booking.BookingStatus currentStatus = Booking.BookingStatus.PENDING;
        Booking.BookingStatus newStatus = Booking.BookingStatus.CONFIRMED;

        // When & Then - Should not throw exception (all transitions allowed)
        assertDoesNotThrow(() ->
            bookingValidationService.validateStatusTransition(currentStatus, newStatus)
        );
    }
}
