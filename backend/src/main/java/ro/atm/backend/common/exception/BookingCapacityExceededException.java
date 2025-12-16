package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class BookingCapacityExceededException extends BaseException {

    public BookingCapacityExceededException(int requested, int available) {
        super(
            String.format("Requested capacity %d exceeds available capacity %d", requested, available),
            "BOOKING_CAPACITY_EXCEEDED",
            HttpStatus.CONFLICT
        );
        withDetail("requestedCapacity", requested);
        withDetail("availableCapacity", available);
    }
}
