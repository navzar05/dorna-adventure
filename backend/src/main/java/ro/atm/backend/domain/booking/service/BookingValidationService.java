package ro.atm.backend.domain.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;

import java.time.LocalDateTime;

/**
 * Service responsible for booking validation logic
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingValidationService {

    private final BookingRepository bookingRepository;

    /**
     * Validate the number of participants for an activity
     */
    public void validateParticipantCount(Activity activity, int numberOfParticipants) {
        if (numberOfParticipants < activity.getMinParticipants() ||
                numberOfParticipants > activity.getMaxParticipants()) {
            throw new RuntimeException("Invalid number of participants. Must be between " +
                    activity.getMinParticipants() + " and " + activity.getMaxParticipants());
        }
    }

    /**
     * Validate guest booking request data
     */
    public void validateGuestBookingData(String guestName, String guestPhone) {
        if (guestName == null || guestName.trim().isEmpty()) {
            throw new RuntimeException("Guest name is required");
        }
        if (guestPhone == null || guestPhone.trim().isEmpty()) {
            throw new RuntimeException("Guest phone is required");
        }
    }

    /**
     * Check if a booking can accept payment
     */
    public boolean canAcceptPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            return false;
        }

        if (booking.getPaymentDeadline() != null &&
                LocalDateTime.now().isAfter(booking.getPaymentDeadline())) {
            return false;
        }

        return booking.getPaymentStatus() != Booking.PaymentStatus.FULLY_PAID;
    }

    /**
     * Validate booking status transition
     */
    public void validateStatusTransition(Booking.BookingStatus currentStatus, Booking.BookingStatus newStatus) {
        // Add custom validation logic if needed
        // For now, we allow all transitions (managed by admin)
        log.debug("Status transition from {} to {}", currentStatus, newStatus);
    }
}
