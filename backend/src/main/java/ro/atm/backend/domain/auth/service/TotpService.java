package ro.atm.backend.domain.auth.service;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.CodeGenerationException;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@Slf4j
public class TotpService {

    private static final String ISSUER = "Dorna Adventure";
    private static final int TOTP_DIGITS = 6;
    private static final int TOTP_PERIOD = 30;
    private static final int ALLOWED_TIME_DISCREPANCY = 1; // Allow 1 time window (30s) before/after

    /**
     * Generate a new TOTP secret
     */
    public String generateSecret() {
        DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();
        String secret = secretGenerator.generate();
        log.info("Generated TOTP secret (length: {})", secret.length());
        return secret;
    }

    /**
     * Generate QR code data URL for TOTP setup
     */
    public String generateQrCodeDataUrl(String secret, String username) throws QrGenerationException {
        QrData data = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(TOTP_DIGITS)
                .period(TOTP_PERIOD)
                .build();

        QrGenerator generator = new ZxingPngQrGenerator();
        byte[] imageData = generator.generate(data);
        String base64Image = Base64.getEncoder().encodeToString(imageData);

        log.info("Generated QR code for user: {}", username);
        return "data:image/png;base64," + base64Image;
    }

    /**
     * Verify TOTP code with time tolerance
     */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) {
            log.error("Secret or code is null");
            return false;
        }

        String cleanCode = code.replaceAll("[^0-9]", "");

        if (cleanCode.length() != TOTP_DIGITS) {
            log.error("Invalid code length: {} (expected {})", cleanCode.length(), TOTP_DIGITS);
            return false;
        }

        try {
            TimeProvider timeProvider = new SystemTimeProvider();
            CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, TOTP_DIGITS);

            CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

            boolean isValid = verifier.isValidCode(secret, cleanCode);

            if (isValid) {
                log.info("TOTP code verified successfully");
            } else {
                log.warn("TOTP code verification failed. Code: {}", cleanCode);

                long currentBucket = Math.floorDiv(timeProvider.getTime(), TOTP_PERIOD);
                String expectedCode = codeGenerator.generate(secret, currentBucket);
                log.debug("Expected code at current time: {} (server time: {})",
                        expectedCode, timeProvider.getTime());
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying TOTP code", e);
            return false;
        }
    }

    /**
     * Generate current TOTP code (for testing/debugging only)
     */
    public String generateCurrentCode(String secret) throws CodeGenerationException {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, TOTP_DIGITS);
        long currentBucket = Math.floorDiv(timeProvider.getTime(), TOTP_PERIOD);
        String code = codeGenerator.generate(secret, currentBucket);

        log.debug("Generated test code: {} at time: {}", code, timeProvider.getTime());
        return code;
    }

    /**
     * Verify code with custom time discrepancy
     */
    public boolean verifyCodeWithDiscrepancy(String secret, String code, int discrepancy) {
        if (secret == null || code == null) {
            return false;
        }

        String cleanCode = code.replaceAll("[^0-9]", "");

        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, TOTP_DIGITS);
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

        return verifier.isValidCode(secret, cleanCode);
    }
}
