package ro.atm.backend.common.constants;

public final class ValidationMessages {
    private ValidationMessages() {} // Prevent instantiation

    public static final class Booking {
        private Booking() {}

        public static final String INVALID_PARTICIPANT_COUNT = "Number of participants must be between {min} and {max}";
        public static final String DATE_IN_PAST = "Booking date cannot be in the past";
        public static final String TIME_SLOT_UNAVAILABLE = "The selected time slot is not available";
        public static final String NO_EMPLOYEE_AVAILABLE = "No employee available for this time slot";
        public static final String BOOKING_NOT_FOUND = "Booking not found";
        public static final String CAPACITY_EXCEEDED = "Requested capacity exceeds available capacity";
    }

    public static final class Payment {
        private Payment() {}

        public static final String INVALID_AMOUNT = "Payment amount must be greater than zero";
        public static final String BOOKING_NOT_CONFIRMED = "Cannot process payment for unconfirmed booking";
        public static final String PAYMENT_DEADLINE_PASSED = "Payment deadline has passed";
        public static final String PAYMENT_ALREADY_COMPLETED = "Payment has already been completed";
    }

    public static final class User {
        private User() {}

        public static final String USERNAME_ALREADY_EXISTS = "Username already exists";
        public static final String EMAIL_ALREADY_EXISTS = "Email already exists";
        public static final String INVALID_CREDENTIALS = "Invalid username or password";
        public static final String USER_NOT_FOUND = "User not found";
        public static final String WEAK_PASSWORD = "Password must be at least 8 characters long";
    }

    public static final class Employee {
        private Employee() {}

        public static final String EMPLOYEE_NOT_FOUND = "Employee not found";
        public static final String NOT_AN_EMPLOYEE = "User is not an employee";
        public static final String EMPLOYEE_UNAVAILABLE = "Employee is not available at the requested time";
        public static final String SWAP_NOT_ALLOWED = "Employee swap is not allowed for these bookings";
    }

    public static final class Activity {
        private Activity() {}

        public static final String ACTIVITY_NOT_FOUND = "Activity not found";
        public static final String CATEGORY_NOT_FOUND = "Category not found";
        public static final String INVALID_DURATION = "Activity duration must be positive";
        public static final String INVALID_PRICE = "Price must be greater than zero";
    }
}
