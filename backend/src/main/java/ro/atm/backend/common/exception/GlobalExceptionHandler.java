package ro.atm.backend.common.exception;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "ro.atm.backend")
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
        log.error("Business exception: {} - {}", ex.getErrorCode(), ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        log.error("Validation failed: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(BookingNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleBookingNotFound(BookingNotFoundException ex) {
        log.error("Booking not found: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEmployeeNotFound(EmployeeNotFoundException ex) {
        log.error("Employee not found: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ErrorResponse> handlePayment(PaymentException ex) {
        log.error("Payment error: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(StripeIntegrationException.class)
    public ResponseEntity<ErrorResponse> handleStripeIntegration(StripeIntegrationException ex) {
        log.error("Stripe integration error: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), ex.getHttpStatus(), ex.getDetails());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        log.error("Bad credentials: {}", ex.getMessage());
        return buildErrorResponse("Invalid username or password", "BAD_CREDENTIALS", HttpStatus.UNAUTHORIZED, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.error("Invalid argument: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), "INVALID_ARGUMENT", HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return buildErrorResponse("An unexpected error occurred", "INTERNAL_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, null);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabledException(DisabledException ex) {
        log.error("Account disabled: {}", ex.getMessage());
        return buildErrorResponse(
                "Your account is disabled. Please verify your email.",
                "ACCOUNT_DISABLED",
                HttpStatus.UNAUTHORIZED,
                null
        );
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            String message, String errorCode, HttpStatus status, Map<String, Object> details) {
        ErrorResponse response = ErrorResponse.builder()
                .message(message)
                .errorCode(errorCode)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .details(details)
                .build();
        return ResponseEntity.status(status).body(response);
    }

    @Data
    @Builder
    public static class ErrorResponse {
        private String message;
        private String errorCode;
        private Integer status;
        private LocalDateTime timestamp;
        private Map<String, Object> details;
    }
}
