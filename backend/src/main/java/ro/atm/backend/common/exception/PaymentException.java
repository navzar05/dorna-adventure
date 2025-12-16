package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class PaymentException extends BaseException {

    public PaymentException(String message) {
        super(message, "PAYMENT_ERROR", HttpStatus.BAD_REQUEST);
    }

    public PaymentException(String message, Throwable cause) {
        super(message, "PAYMENT_ERROR", HttpStatus.BAD_REQUEST);
        initCause(cause);
    }
}
