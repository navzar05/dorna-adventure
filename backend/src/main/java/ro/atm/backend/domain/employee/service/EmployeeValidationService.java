package ro.atm.backend.domain.employee.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.employee.dto.CreateEmployeeRequest;
import ro.atm.backend.common.exception.ValidationException;
import ro.atm.backend.common.exception.UsernameAlreadyExistsException;
import ro.atm.backend.common.exception.EmployeeNotFoundException;

/**
 * Service responsible for employee-related validations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeValidationService {

    private final UserRepository userRepository;

    /**
     * Validates employee data before creation or update
     */
    public void validateEmployeeData(CreateEmployeeRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new ValidationException("username", "Username is required");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ValidationException("email", "Email is required");
        }

        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            throw new ValidationException("firstName", "First name is required");
        }

        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            throw new ValidationException("lastName", "Last name is required");
        }

        // Additional validations can be added here
    }

    /**
     * Validates that username is unique
     */
    public void validateUsernameUnique(String username) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }
    }

    /**
     * Validates that username is unique for update (excluding current user)
     */
    public void validateUsernameUniqueForUpdate(String username, Long currentUserId) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (!user.getId().equals(currentUserId)) {
                throw new UsernameAlreadyExistsException(username);
            }
        });
    }

    /**
     * Validates that user exists and has employee role
     */
    public User validateEmployeeExists(Long employeeId) {
        return userRepository.findById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeId));
    }
}
