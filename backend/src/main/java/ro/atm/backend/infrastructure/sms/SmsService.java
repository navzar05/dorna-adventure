package ro.atm.backend.infrastructure.sms;

import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
public class SmsService {

    @Value("${twilio.phone-number:}")
    private String fromPhoneNumber;

    @Value("${api.url}")
    private String apiUrl;

    /**
     * Send payment link SMS to guest after booking creation
     */
    @Async
    public void sendPaymentLink(String toPhoneNumber, Long bookingId,
                                String customerName, BigDecimal depositAmount) {
        // Validate Twilio is configured
        if (!isTwilioConfigured()) {
            log.warn("⚠️  Twilio not configured, skipping payment link SMS to {}", toPhoneNumber);
            return;
        }

        String paymentUrl = apiUrl + "/payment?bookingId=" + bookingId;
        String message = String.format(
            "Hi %s! Complete your booking payment (RON %.2f) here: %s - Dorna Adventure",
            customerName, depositAmount, paymentUrl
        );

        sendSms(toPhoneNumber, message, "payment link");
    }

    /**
     * Send booking confirmation SMS after successful payment
     */
    @Async
    public void sendBookingConfirmation(String toPhoneNumber, Long bookingId,
                                       String activityName, String bookingDate) {
        if (!isTwilioConfigured()) {
            log.warn("⚠️  Twilio not configured, skipping booking confirmation SMS to {}", toPhoneNumber);
            return;
        }

        String message = String.format(
            "Booking confirmed! %s on %s. Booking #%d. See you there! - Dorna Adventure",
            activityName, bookingDate, bookingId
        );

        sendSms(toPhoneNumber, message, "booking confirmation");
    }

    /**
     * Send verification code SMS for registration (future feature)
     */
    @Async
    public void sendRegistrationCode(String toPhoneNumber, String verificationCode) {
        if (!isTwilioConfigured()) {
            log.warn("⚠️  Twilio not configured, skipping verification code SMS to {}", toPhoneNumber);
            return;
        }

        String message = String.format(
            "Your Dorna Adventure verification code is: %s. Valid for 10 minutes.",
            verificationCode
        );

        sendSms(toPhoneNumber, message, "verification code");
    }

    /**
     * Generic method to send SMS using Twilio
     */
    private void sendSms(String toPhoneNumber, String messageBody, String messageType) {
        try {
            Message sms = Message.creator(
                new PhoneNumber(toPhoneNumber),
                new PhoneNumber(fromPhoneNumber),
                messageBody
            ).create();

            log.info("📱 SMS {} sent to {} (SID: {})", messageType, toPhoneNumber, sms.getSid());
        } catch (Exception e) {
            log.error("❌ Failed to send {} SMS to {}: {}", messageType, toPhoneNumber, e.getMessage(), e);
        }
    }

    /**
     * Check if Twilio is properly configured
     */
    private boolean isTwilioConfigured() {
        return fromPhoneNumber != null && !fromPhoneNumber.isBlank();
    }
}
