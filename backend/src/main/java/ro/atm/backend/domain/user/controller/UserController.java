package ro.atm.backend.domain.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.user.dto.ChangePasswordRequest;
import ro.atm.backend.domain.user.dto.UpdateUserRequest;
import ro.atm.backend.domain.user.dto.UserDTO;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.auth.dto.TotpSetupResponse;
import ro.atm.backend.domain.auth.service.TotpService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(UserDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            Authentication authentication,
            @RequestBody UpdateUserRequest request) {

        String username = authentication.getName();
        Map<String, String> errorResponse = new HashMap<>();

        return userRepository.findByUsername(username)
                .map(user -> {
                    if (!user.getEmail().equals(request.getEmail())) {
                        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                            errorResponse.put("error", "Email is already in use");
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                        }
                    }

                    if (!user.getPhoneNumber().equals(request.getPhoneNumber())) {
                        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
                            errorResponse.put("error", "Phone number is already in use");
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                        }
                    }

                    user.setEmail(request.getEmail()); // Add this
                    user.setFirstName(request.getFirstName());
                    user.setLastName(request.getLastName());
                    user.setPhoneNumber(request.getPhoneNumber());

                    User updated = userRepository.save(user);
                    return ResponseEntity.ok((Object) UserDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request) {

        String username = authentication.getName();
        Map<String, String> response = new HashMap<>();

        return userRepository.findByUsername(username)
                .map(user -> {
                    // Verify current password
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        response.put("error", "Current password is incorrect");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    // Update password and mark as no longer temporary
                    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                    user.setPasswordTemporary(false);
                    userRepository.save(user);

                    response.put("message", "Password changed successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me/password/temporary")
    public ResponseEntity<Map<String, String>> changeTemporaryPassword(
            Authentication authentication,
            @RequestBody Map<String, String> request) {

        String username = authentication.getName();
        String newPassword = request.get("newPassword");
        Map<String, String> response = new HashMap<>();

        if (newPassword == null || newPassword.length() < 6) {
            response.put("error", "New password must be at least 6 characters");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        return userRepository.findByUsername(username)
                .map(user -> {
                    // Only allow if password is marked as temporary
                    if (!user.isPasswordTemporary()) {
                        response.put("error", "Password is not temporary");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    // Update password and mark as no longer temporary
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setPasswordTemporary(false);
                    userRepository.save(user);

                    response.put("message", "Password changed successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteAccount(
            Authentication authentication,
            @RequestBody Map<String, String> request) {

        String username = authentication.getName();
        String password = request.get("password");
        Map<String, String> response = new HashMap<>();

        return userRepository.findByUsername(username)
                .map(user -> {
                    // Verify password before deletion
                    if (!passwordEncoder.matches(password, user.getPassword())) {
                        response.put("error", "Password is incorrect");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    userRepository.delete(user);
                    response.put("message", "Account deleted successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/totp/setup")
    public ResponseEntity getTotpSetup(Authentication authentication) {
        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .map(user -> {
                    try {
                        // If TOTP is already enabled, user doesn't need setup
                        if (user.getTotpEnabled() != null && user.getTotpEnabled()) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                        }

                        // Generate new secret if user doesn't have one
                        String secret = user.getTotpSecret();
                        if (secret == null) {
                            secret = totpService.generateSecret();
                            user.setTotpSecret(secret);
                            user.setTotpEnabled(false); // Don't enable until verified
                            userRepository.save(user);
                        }

                        String qrCodeDataUrl = totpService.generateQrCodeDataUrl(secret, user.getUsername());
                        TotpSetupResponse response = TotpSetupResponse.builder()
                                .secret(secret)
                                .qrCodeDataUrl(qrCodeDataUrl)
                                .build();
                        return ResponseEntity.ok(response);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/me/totp/verify")
    public ResponseEntity<Map<String, String>> verifyTotp(
            Authentication authentication,
            @RequestBody Map<String, String> request) {

        String username = authentication.getName();
        String code = request.get("code");
        Map<String, String> response = new HashMap<>();

        if (code == null || code.length() != 6) {
            response.put("error", "Invalid code format");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        return userRepository.findByUsername(username)
                .map(user -> {
                    if (user.getTotpSecret() == null) {
                        response.put("error", "TOTP not set up");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    if (!totpService.verifyCode(user.getTotpSecret(), code)) {
                        response.put("error", "Invalid verification code");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    // Enable TOTP after successful verification
                    user.setTotpEnabled(true);
                    userRepository.save(user);

                    response.put("message", "TOTP enabled successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
