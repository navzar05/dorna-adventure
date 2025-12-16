package ro.atm.backend.common.exception;

import org.springframework.http.HttpStatus;

public class EmployeeNotFoundException extends BaseException {

    public EmployeeNotFoundException(Long employeeId) {
        super(
            String.format("Employee with ID %d not found", employeeId),
            "EMPLOYEE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
        withDetail("employeeId", employeeId);
    }
}
