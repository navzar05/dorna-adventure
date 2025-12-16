package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidTotpCodeException extends BaseException {

    public InvalidTotpCodeException(String message) {
        super(message, "INVALID_TOTP_CODE", HttpStatus.UNAUTHORIZED);
    }

    public InvalidTotpCodeException() {
        super("Invalid authentication code", "INVALID_TOTP_CODE", HttpStatus.UNAUTHORIZED);
    }
}
