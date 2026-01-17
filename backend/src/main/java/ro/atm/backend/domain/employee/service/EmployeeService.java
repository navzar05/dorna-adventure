package ro.atm.backend.domain.employee.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.auth.dto.TotpSetupResponse;
import ro.atm.backend.domain.auth.entity.Role;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.dto.UserDTO;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.employee.dto.CreateEmployeeRequest;
import ro.atm.backend.domain.employee.dto.EmployeeDTO;
import ro.atm.backend.domain.employee.dto.EmployeeSwapInfo;
import ro.atm.backend.domain.employee.dto.EmployeeSwapOptions;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;
import ro.atm.backend.infrastructure.email.EmailService;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Main Employee service handling core CRUD operations
 * Delegates to specialized services for specific concerns
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Specialized services
    private final EmployeeSchedulingService schedulingService;
    private final EmployeeTotpManagementService totpManagementService;
    private final EmployeeValidationService validationService;

    // ========== Core CRUD Operations ==========

    public List<EmployeeDTO> getAllEmployees() {
        Role employeeRole = roleRepository.findByName(SecurityConstants.Roles.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.EMPLOYEE));

        return userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(employeeRole))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getEmployeeById(Long id) {
        User user = validationService.validateEmployeeExists(id);
        return toDTO(user);
    }

    @Transactional
    public UserDTO createEmployee(CreateEmployeeRequest request) {
        log.info("Creating employee: username={}, roles={}, totpEnabled={}",
                request.getUsername(), request.getRoles(), request.getTotpEnabled());

        validationService.validateEmployeeData(request);
        validationService.validateUsernameUnique(request.getUsername());

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        // Generate random temporary password
        String temporaryPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(temporaryPassword));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        // Set enabled to FALSE initially - user must verify email
        user.setEnabled(false);
        user.setPasswordTemporary(true); // Password set by admin is temporary

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);

        // Set roles
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
            user.setRoles(roles);
            log.info("Assigned {} roles to user {}", roles.size(), user.getUsername());
        }

        if (request.getTotpSecret() != null && request.getTotpEnabled() != null) {
            user.setTotpSecret(request.getTotpSecret());
            // Don't enable TOTP until the user verifies it themselves on first login
            user.setTotpEnabled(false);
            log.info("TOTP secret configured for user {}, but not enabled yet (user must verify on first login). secretLength={}",
                    user.getUsername(), request.getTotpSecret().length());
        } else {
            log.info("No TOTP configured for user {}", user.getUsername());
        }

        user = userRepository.save(user);
        log.info("User {} saved with ID: {}", user.getUsername(), user.getId());

        // Send employee account creation email with temporary password and verification link
        emailService.sendEmployeeAccountCreatedEmail(
            user.getEmail(),
            user.getFirstName(),
            user.getUsername(),
            temporaryPassword,
            verificationToken
        );
        log.info("Employee account creation email sent to {} with temporary password", user.getEmail());

        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO updateEmployee(Long id, CreateEmployeeRequest request) {
        User user = validationService.validateEmployeeExists(id);

        // Update basic fields
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        // Update roles
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
            user.setRoles(roles);
        }

        // Handle TOTP updates
        if (request.getTotpSecret() != null) {
            // Setting new TOTP secret
            user.setTotpSecret(request.getTotpSecret());
            user.setTotpEnabled(request.getTotpEnabled() != null ? request.getTotpEnabled() : false);
            log.info("Updated TOTP for user {}: enabled={}", user.getUsername(), user.getTotpEnabled());
        } else if (request.getTotpEnabled() != null && !request.getTotpEnabled()) {
            // Explicitly disabling TOTP
            user.setTotpSecret(null);
            user.setTotpEnabled(false);
            log.info("Disabled TOTP for user {}", user.getUsername());
        }

        user = userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    public void deleteEmployee(Long id) {
        userRepository.deleteById(id);
    }

    // ========== Delegated Operations ==========

    // Employee Scheduling (delegated to EmployeeSchedulingService)
    public EmployeeSwapInfo checkEmployeeSwap(Long bookingId, Long newEmployeeId) {
        return schedulingService.checkEmployeeSwap(bookingId, newEmployeeId);
    }

    @Transactional
    public void swapEmployees(Long booking1Id, Long booking2Id) {
        schedulingService.swapEmployees(booking1Id, booking2Id);
    }

    public EmployeeSwapOptions getEmployeeSwapOptions(Long bookingId, Long newEmployeeId) {
        return schedulingService.getEmployeeSwapOptions(bookingId, newEmployeeId);
    }

    // TOTP Management (delegated to EmployeeTotpManagementService)
    @Transactional
    public TotpSetupResponse setupTotp(Long userId) {
        return totpManagementService.setupTotp(userId);
    }

    @Transactional
    public void verifyAndEnableTotp(Long userId, String code) {
        totpManagementService.verifyAndEnableTotp(userId, code);
    }

    @Transactional
    public void disableTotp(Long userId) {
        totpManagementService.disableTotp(userId);
    }

    public TotpSetupResponse generateTotpForNewUser(String username) {
        return totpManagementService.generateTotpForNewUser(username);
    }

    public boolean verifyTotpCode(String secret, String code) {
        return totpManagementService.verifyTotpCode(secret, code);
    }

    // ========== Helper Methods ==========

    private EmployeeDTO toDTO(User user) {
        return EmployeeDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .enabled(user.isEnabled())
                .build();
    }

    /**
     * Generates a secure random password for new employees
     * @return 12-character password with mixed case, digits, and special characters
     */
    private String generateRandomPassword() {
        String upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerCase = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String specialChars = "!@#$%&*";
        String allChars = upperCase + lowerCase + digits + specialChars;

        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(12);

        // Ensure at least one character from each category
        password.append(upperCase.charAt(random.nextInt(upperCase.length())));
        password.append(lowerCase.charAt(random.nextInt(lowerCase.length())));
        password.append(digits.charAt(random.nextInt(digits.length())));
        password.append(specialChars.charAt(random.nextInt(specialChars.length())));

        // Fill the rest randomly
        for (int i = 4; i < 12; i++) {
            password.append(allChars.charAt(random.nextInt(allChars.length())));
        }

        // Shuffle the password to randomize positions
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }

        return new String(passwordArray);
    }
}
