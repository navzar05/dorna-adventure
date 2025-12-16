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

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

                    // Update password
                    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
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
}
