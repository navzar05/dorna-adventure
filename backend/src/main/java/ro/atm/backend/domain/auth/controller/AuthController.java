package ro.atm.backend.domain.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.auth.dto.LoginRequest;
import ro.atm.backend.domain.auth.dto.LoginResponse;
import ro.atm.backend.domain.auth.dto.RegisterRequest;
import ro.atm.backend.domain.auth.service.AuthenticationService;
import ro.atm.backend.domain.user.dto.UserDTO;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam("token") String token) {
        authenticationService.verifyAccount(token);
        return ResponseEntity.ok("Account verified successfully! You can now login.");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendEmailVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        authenticationService.resendVerificationEmail(email);
        return ResponseEntity.ok("Email resent.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        authenticationService.forgotPassword(email);
        return ResponseEntity.ok("Password reset link sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Token and new password are required");
        }

        authenticationService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Password reset successfully. You can now login.");
    }
}
