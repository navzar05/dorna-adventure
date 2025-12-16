package ro.atm.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ValidationException extends BaseException {

    private final String field;

    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.field = null;
    }

    public ValidationException(String field, String message) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.field = field;
        withDetail("field", field);
    }
}