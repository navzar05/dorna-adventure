package ro.atm.backend.domain.employee.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.auth.dto.TotpSetupResponse;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.auth.service.TotpService;
import ro.atm.backend.domain.user.repository.UserRepository;

/**
 * Service responsible for managing TOTP (Time-based One-Time Password) 2FA for employees
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeTotpManagementService {

    private final UserRepository userRepository;
    private final TotpService totpService;

    /**
     * Initiates TOTP setup for an existing employee
     */
    @Transactional
    public TotpSetupResponse setupTotp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate new secret
        String secret = totpService.generateSecret();

        // Save secret (but don't enable yet - user must verify first)
        user.setTotpSecret(secret);
        user.setTotpEnabled(false);
        userRepository.save(user);

        try {
            String qrCodeDataUrl = totpService.generateQrCodeDataUrl(secret, user.getUsername());
            return TotpSetupResponse.builder()
                    .secret(secret)
                    .qrCodeDataUrl(qrCodeDataUrl)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Verifies the TOTP code and enables TOTP for the user
     */
    @Transactional
    public void verifyAndEnableTotp(Long userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTotpSecret() == null) {
            throw new RuntimeException("TOTP not set up for this user");
        }

        log.info("Verifying TOTP code for user: {} (ID: {})", user.getUsername(), userId);
        log.debug("Secret length: {}, Code length: {}", user.getTotpSecret().length(), code.length());

        if (!totpService.verifyCode(user.getTotpSecret(), code)) {
            log.error("TOTP verification failed for user: {}", user.getUsername());
            throw new RuntimeException("Invalid verification code");
        }

        log.info("TOTP verification successful, enabling TOTP for user: {}", user.getUsername());
        user.setTotpEnabled(true);
        userRepository.save(user);
    }

    /**
     * Disables TOTP for a user
     */
    @Transactional
    public void disableTotp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        userRepository.save(user);
    }

    /**
     * Generates TOTP setup for a new user (before creation)
     */
    public TotpSetupResponse generateTotpForNewUser(String username) {
        if (username == null || username.isEmpty()) {
            throw new RuntimeException("Username is required");
        }

        String secret = totpService.generateSecret();

        try {
            String qrCodeDataUrl = totpService.generateQrCodeDataUrl(secret, username);
            return TotpSetupResponse.builder()
                    .secret(secret)
                    .qrCodeDataUrl(qrCodeDataUrl)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Verifies a TOTP code against a secret
     */
    public boolean verifyTotpCode(String secret, String code) {
        return totpService.verifyCode(secret, code);
    }
}
