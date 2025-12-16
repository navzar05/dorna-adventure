package ro.atm.backend.common.constants;

public final class BookingConstants {
    private BookingConstants() {} // Prevent instantiation

    public static final int DEFAULT_BOOKING_SLOT_MINUTES = 30;
    public static final int PAYMENT_DEADLINE_HOURS = 24;
    public static final int EXPIRED_BOOKING_CHECK_INTERVAL_MS = 3600000; // 1 hour

    public static final class Status {
        private Status() {}

        public static final String PENDING = "PENDING";
        public static final String CONFIRMED = "CONFIRMED";
        public static final String CANCELLED = "CANCELLED";
        public static final String COMPLETED = "COMPLETED";
    }

    public static final class PaymentStatus {
        private PaymentStatus() {}

        public static final String UNPAID = "UNPAID";
        public static final String DEPOSIT_PAID = "DEPOSIT_PAID";
        public static final String FULLY_PAID = "FULLY_PAID";
    }

    public static final class Validation {
        private Validation() {}

        public static final int MIN_ADVANCE_BOOKING_HOURS = 2;
        public static final int MAX_ADVANCE_BOOKING_DAYS = 90;
    }
}
