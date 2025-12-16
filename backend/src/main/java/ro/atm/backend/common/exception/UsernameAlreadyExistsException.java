package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class UsernameAlreadyExistsException extends BaseException {

    public UsernameAlreadyExistsException(String username) {
        super(
            String.format("Username '%s' already exists", username),
            "USERNAME_ALREADY_EXISTS",
            HttpStatus.CONFLICT
        );
        withDetail("username", username);
    }

    public UsernameAlreadyExistsException() {
        super("Username already exists", "USERNAME_ALREADY_EXISTS", HttpStatus.CONFLICT);
    }
}
