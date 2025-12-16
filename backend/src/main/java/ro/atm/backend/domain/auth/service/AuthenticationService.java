package ro.atm.backend.domain.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.domain.auth.dto.LoginRequest;
import ro.atm.backend.domain.auth.dto.LoginResponse;
import ro.atm.backend.domain.auth.dto.RegisterRequest;
import ro.atm.backend.domain.auth.entity.Role;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.dto.UserDTO;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.common.security.JwtService;
import ro.atm.backend.common.exception.UsernameAlreadyExistsException;
import ro.atm.backend.common.exception.InvalidCredentialsException;
import ro.atm.backend.common.exception.InvalidTotpCodeException;
import ro.atm.backend.common.exception.ResourceNotFoundException;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.infrastructure.email.EmailService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TotpService totpService;
    private final EmailService emailService;

    @Transactional
    public UserDTO register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException(request.getUsername());
        }

        Role userRole = roleRepository.findByName(SecurityConstants.Roles.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.USER));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        // 1. Set enabled to FALSE initially
        user.setEnabled(false);
        user.setRoles(Collections.singleton(userRole));

        // 2. Generate Verification Token
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);

        user = userRepository.save(user);

        // 3. Send Email
        emailService.sendAccountVerificationEmail(user.getEmail(), user.getFirstName(), token);

        return UserDTO.fromEntity(user);
    }

    // 4. Add Verification Logic
    public void verifyAccount(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Verification Token", token));

        if (user.isEnabled()) {
            return; // Already verified
        }

        user.setEnabled(true);
        user.setVerificationToken(null); // Optional: Clear token after use
        userRepository.save(user);
    }

    public void resendVerificationEmail(String email) {
        User user = userRepository
                .findByEmail(email)
                .orElse(
                        userRepository
                        .findByUsername(email)
                                .orElseThrow(() -> new ResourceNotFoundException("Email", email)
                                )
                );

        emailService.sendAccountVerificationEmail(user.getEmail(), user.getFirstName(), user.getVerificationToken());
    }

    public LoginResponse login(LoginRequest request) {
        // Authenticate username and password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUsername()));

        log.info("User {} authenticated. TOTP enabled: {}", user.getUsername(), user.getTotpEnabled());

        // Check if user requires TOTP
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            // If TOTP code is provided, verify it
            if (request.getTotpCode() != null && !request.getTotpCode().isEmpty()) {
                log.info("Verifying TOTP code for user: {}", user.getUsername());

                if (!totpService.verifyCode(user.getTotpSecret(), request.getTotpCode())) {
                    log.warn("Invalid TOTP code provided for user: {}", user.getUsername());
                    throw new InvalidTotpCodeException();
                }

                log.info("TOTP verification successful for user: {}", user.getUsername());

                // TOTP verified, proceed with login
                String token = jwtService.generateToken(user);
                return LoginResponse.builder()
                        .token(token)
                        .user(UserDTO.fromEntity(user))
                        .requiresTotp(false)
                        .build();
            } else {
                log.info("TOTP required for user: {}", user.getUsername());
                // TOTP required but not provided
                return LoginResponse.builder()
                        .requiresTotp(true)
                        .tempToken(UUID.randomUUID().toString())
                        .user(UserDTO.fromEntity(user))
                        .build();
            }
        }

        log.info("No TOTP required for user: {}", user.getUsername());
        // No TOTP required, proceed with login
        String token = jwtService.generateToken(user);
        return LoginResponse.builder()
                .token(token)
                .user(UserDTO.fromEntity(user))
                .requiresTotp(false)
                .build();
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new ResourceNotFoundException("User with email/username", email));

        // 1. Generate Token
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);

        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);

        // 3. Send Email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Reset Token", token));

        // 1. Validate Expiry
        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired. Please request a new one.");
        }

        // 2. Update Password
        user.setPassword(passwordEncoder.encode(newPassword));

        // 3. Clear Token
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);

        userRepository.save(user);
    }
}
