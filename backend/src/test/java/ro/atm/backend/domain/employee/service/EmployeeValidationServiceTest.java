package ro.atm.backend.domain.employee.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.employee.dto.CreateEmployeeRequest;
import ro.atm.backend.common.exception.ValidationException;
import ro.atm.backend.common.exception.UsernameAlreadyExistsException;
import ro.atm.backend.common.exception.EmployeeNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmployeeValidationService.
 * Demonstrates testing patterns for validation logic with custom exceptions.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeValidationService Tests")
class EmployeeValidationServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeeValidationService employeeValidationService;

    private CreateEmployeeRequest validRequest;
    private User existingUser;

    @BeforeEach
    void setUp() {
        // Setup valid employee request
        validRequest = new CreateEmployeeRequest();
        validRequest.setUsername("john.doe");
        validRequest.setEmail("john.doe@example.com");
        validRequest.setFirstName("John");
        validRequest.setLastName("Doe");

        // Setup existing user
        existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("existing.user");
        existingUser.setEmail("existing@example.com");
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
    }

    @Test
    @DisplayName("Should validate employee data successfully with valid request")
    void testValidateEmployeeData_Valid() {
        // When & Then - Should not throw exception
        assertDoesNotThrow(() ->
            employeeValidationService.validateEmployeeData(validRequest)
        );
    }

    @Test
    @DisplayName("Should throw ValidationException when username is null")
    void testValidateEmployeeData_NullUsername() {
        // Given
        validRequest.setUsername(null);

        // When & Then
        ValidationException exception = assertThrows(ValidationException.class, () ->
            employeeValidationService.validateEmployeeData(validRequest)
        );

        assertEquals("username", exception.getField());
        assertEquals("Username is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw ValidationException when username is empty")
    void testValidateEmployeeData_EmptyUsername() {
        // Given
        validRequest.setUsername("   ");

        // When & Then
        ValidationException exception = assertThrows(ValidationException.class, () ->
            employeeValidationService.validateEmployeeData(validRequest)
        );

        assertEquals("username", exception.getField());
        assertTrue(exception.getMessage().contains("Username is required"));
    }

    @Test
    @DisplayName("Should throw ValidationException when email is null")
    void testValidateEmployeeData_NullEmail() {
        // Given
        validRequest.setEmail(null);

        // When & Then
        ValidationException exception = assertThrows(ValidationException.class, () ->
            employeeValidationService.validateEmployeeData(validRequest)
        );

        assertEquals("email", exception.getField());
        assertEquals("Email is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw ValidationException when first name is null")
    void testValidateEmployeeData_NullFirstName() {
        // Given
        validRequest.setFirstName(null);

        // When & Then
        ValidationException exception = assertThrows(ValidationException.class, () ->
            employeeValidationService.validateEmployeeData(validRequest)
        );

        assertEquals("firstName", exception.getField());
        assertEquals("First name is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw ValidationException when last name is null")
    void testValidateEmployeeData_NullLastName() {
        // Given
        validRequest.setLastName(null);

        // When & Then
        ValidationException exception = assertThrows(ValidationException.class, () ->
            employeeValidationService.validateEmployeeData(validRequest)
        );

        assertEquals("lastName", exception.getField());
        assertEquals("Last name is required", exception.getMessage());
    }

    @Test
    @DisplayName("Should validate username as unique when username does not exist")
    void testValidateUsernameUnique_Success() {
        // Given
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

        // When & Then - Should not throw exception
        assertDoesNotThrow(() ->
            employeeValidationService.validateUsernameUnique("new.username")
        );

        verify(userRepository, times(1)).findByUsername("new.username");
    }

    @Test
    @DisplayName("Should throw UsernameAlreadyExistsException when username exists")
    void testValidateUsernameUnique_UsernameExists() {
        // Given
        String existingUsername = "existing.user";
        when(userRepository.findByUsername(existingUsername)).thenReturn(Optional.of(existingUser));

        // When & Then
        UsernameAlreadyExistsException exception = assertThrows(UsernameAlreadyExistsException.class, () ->
            employeeValidationService.validateUsernameUnique(existingUsername)
        );

        assertTrue(exception.getMessage().contains(existingUsername));
        verify(userRepository, times(1)).findByUsername(existingUsername);
    }

    @Test
    @DisplayName("Should validate username for update when username belongs to current user")
    void testValidateUsernameUniqueForUpdate_SameUser() {
        // Given
        Long currentUserId = 1L;
        existingUser.setId(currentUserId);
        when(userRepository.findByUsername("existing.user")).thenReturn(Optional.of(existingUser));

        // When & Then - Should not throw exception (same user)
        assertDoesNotThrow(() ->
            employeeValidationService.validateUsernameUniqueForUpdate("existing.user", currentUserId)
        );

        verify(userRepository, times(1)).findByUsername("existing.user");
    }

    @Test
    @DisplayName("Should throw exception when username belongs to different user during update")
    void testValidateUsernameUniqueForUpdate_DifferentUser() {
        // Given
        Long currentUserId = 2L;
        existingUser.setId(1L); // Different user ID
        when(userRepository.findByUsername("existing.user")).thenReturn(Optional.of(existingUser));

        // When & Then
        UsernameAlreadyExistsException exception = assertThrows(UsernameAlreadyExistsException.class, () ->
            employeeValidationService.validateUsernameUniqueForUpdate("existing.user", currentUserId)
        );

        assertTrue(exception.getMessage().contains("existing.user"));
        verify(userRepository, times(1)).findByUsername("existing.user");
    }

    @Test
    @DisplayName("Should validate username for update when username is new")
    void testValidateUsernameUniqueForUpdate_NewUsername() {
        // Given
        when(userRepository.findByUsername("new.username")).thenReturn(Optional.empty());

        // When & Then - Should not throw exception
        assertDoesNotThrow(() ->
            employeeValidationService.validateUsernameUniqueForUpdate("new.username", 1L)
        );

        verify(userRepository, times(1)).findByUsername("new.username");
    }

    @Test
    @DisplayName("Should validate employee exists and return user")
    void testValidateEmployeeExists_Success() {
        // Given
        Long employeeId = 1L;
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(existingUser));

        // When
        User result = employeeValidationService.validateEmployeeExists(employeeId);

        // Then
        assertNotNull(result);
        assertEquals(existingUser.getId(), result.getId());
        assertEquals(existingUser.getUsername(), result.getUsername());
        verify(userRepository, times(1)).findById(employeeId);
    }

    @Test
    @DisplayName("Should throw EmployeeNotFoundException when employee does not exist")
    void testValidateEmployeeExists_NotFound() {
        // Given
        Long nonExistentId = 999L;
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When & Then
        EmployeeNotFoundException exception = assertThrows(EmployeeNotFoundException.class, () ->
            employeeValidationService.validateEmployeeExists(nonExistentId)
        );

        assertTrue(exception.getMessage().contains(nonExistentId.toString()));
        verify(userRepository, times(1)).findById(nonExistentId);
    }
}
