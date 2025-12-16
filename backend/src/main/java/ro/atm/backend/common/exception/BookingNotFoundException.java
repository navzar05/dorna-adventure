package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class BookingNotFoundException extends BaseException {

    public BookingNotFoundException(Long bookingId) {
        super(
            String.format("Booking with ID %d not found", bookingId),
            "BOOKING_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
        withDetail("bookingId", bookingId);
    }
}
