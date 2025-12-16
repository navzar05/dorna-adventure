package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class StripeIntegrationException extends BaseException {

    public StripeIntegrationException(String message) {
        super(message, "STRIPE_INTEGRATION_ERROR", HttpStatus.BAD_GATEWAY);
    }

    public StripeIntegrationException(String message, Throwable cause) {
        super(message, "STRIPE_INTEGRATION_ERROR", HttpStatus.BAD_GATEWAY);
        initCause(cause);
    }
}
