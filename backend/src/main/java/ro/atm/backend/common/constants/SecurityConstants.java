package ro.atm.backend.common.constants;

public final class SecurityConstants {
    private SecurityConstants() {} // Prevent instantiation

    public static final String JWT_HEADER = "Authorization";
    public static final String JWT_PREFIX = "Bearer ";
    public static final long JWT_EXPIRATION_MS = 86400000; // 24 hours

    public static final class Roles {
        private Roles() {}

        public static final String ADMIN = "ROLE_ADMIN";
        public static final String EMPLOYEE = "ROLE_EMPLOYEE";
        public static final String USER = "ROLE_USER";
    }
}
