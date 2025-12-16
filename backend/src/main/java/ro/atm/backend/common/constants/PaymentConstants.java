package ro.atm.backend.common.constants;

public final class PaymentConstants {
    private PaymentConstants() {} // Prevent instantiation

    public static final String DEFAULT_CURRENCY = "ron";
    public static final int STRIPE_TIMEOUT_SECONDS = 30;

    public static final class PaymentStatus {
        private PaymentStatus() {}

        public static final String PENDING = "PENDING";
        public static final String SUCCEEDED = "SUCCEEDED";
        public static final String FAILED = "FAILED";
        public static final String REFUNDED = "REFUNDED";
    }

    public static final class PaymentMethod {
        private PaymentMethod() {}

        public static final String CARD = "CARD";
        public static final String CASH = "CASH";
        public static final String BANK_TRANSFER = "BANK_TRANSFER";
    }
}
