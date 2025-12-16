package ro.atm.backend.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class TwilioConfig {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String phoneNumber;

    @PostConstruct
    public void init() {
        // Validate config is present
        if (accountSid != null && !accountSid.isBlank() &&
            authToken != null && !authToken.isBlank() &&
            phoneNumber != null && !phoneNumber.isBlank()) {

            Twilio.init(accountSid, authToken);
            log.info("✅ Twilio SMS service initialized successfully with phone number: {}", phoneNumber);
        } else {
            log.warn("⚠️  Twilio credentials not configured. SMS features will be disabled.");
            log.warn("⚠️  To enable SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.");
        }
    }
}
