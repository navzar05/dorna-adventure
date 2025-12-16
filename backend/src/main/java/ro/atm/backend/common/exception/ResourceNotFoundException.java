package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String resourceType, Long id) {
        super(
            String.format("%s with ID %d not found", resourceType, id),
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
        withDetail("resourceType", resourceType);
        withDetail("resourceId", id);
    }

    public ResourceNotFoundException(String resourceType, String identifier) {
        super(
            String.format("%s '%s' not found", resourceType, identifier),
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
        withDetail("resourceType", resourceType);
        withDetail("identifier", identifier);
    }

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}
