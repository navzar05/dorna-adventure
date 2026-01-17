package ro.atm.backend.infrastructure.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender emailSender;

    @Value("${api.url}")
    private String apiUrl;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async // Run in background so it doesn't block the API response
    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            emailSender.send(message);
            log.info("📧 Email sent to {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}", to, e);
        }
    }

    @Async
    public void sendAccountVerificationEmail(String to, String name, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String subject = "Verify your Dorna Adventure Account";

        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Welcome to Dorna Adventure!</h2>
                <p>Hi %s,</p>
                <p>Thank you for registering. Please click the button below to verify your account:</p>
                <a href="%s" style="background-color: #2d6a4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Account</a>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p><small>%s</small></p>
            </div>
            """, name, verificationLink, verificationLink);

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendEmployeeAccountCreatedEmail(String to, String name, String username, String temporaryPassword, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String subject = "Your Dorna Adventure Employee Account";

        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Welcome to Dorna Adventure Team!</h2>
                <p>Hi %s,</p>
                <p>An employee account has been created for you. Here are your login credentials:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Username:</strong> %s</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 5px; border-radius: 3px;">%s</code></p>
                </div>
                <p><strong>Important:</strong> You will be required to change this password on your first login.</p>
                <p>Before you can log in, please verify your account by clicking the button below:</p>
                <a href="%s" style="background-color: #2d6a4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Account</a>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p><small>%s</small></p>
                <br>
                <p>Best regards,<br>Dorna Adventure Team</p>
            </div>
            """, name, username, temporaryPassword, verificationLink, verificationLink);

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendHtmlMessage(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            emailSender.send(message);

            log.info("📧 HTML Email sent to {}", to);
        } catch (MessagingException e) {
            log.error("❌ Failed to send HTML email to {}", to, e);
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String resetUrl = "http://localhost:5174/reset-password?token=" + token; // UPDATE THIS DOMAIN FOR PROD!

        String subject = "Reset Your Password - Dorna Adventure";
        String htmlBody = "<html>" +
                "<body>" +
                "<h2>Hello, " + name + "!</h2>" +
                "<p>You requested to reset your password.</p>" +
                "<p>Click the link below to set a new password:</p>" +
                "<a href=\"" + resetUrl + "\">Reset Password</a>" +
                "<p>This link expires in 15 minutes.</p>" +
                "<p>If you did not request this, please ignore this email.</p>" +
                "</body>" +
                "</html>";

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendPaymentConfirmation(String to, String userName, String amount, String bookingId) {
        String subject = "Payment Confirmation - Booking #" + bookingId;
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Payment Successful!</h2>
                <p>Hi %s,</p>
                <p>We received your payment of <strong>€%s</strong> for booking <strong>#%s</strong>.</p>
                <p>We are looking forward to seeing you!</p>
                <br>
                <p>Best regards,<br>Dorna Adventure Team</p>
            </div>
            """, userName, amount, bookingId);

        sendHtmlMessage(to, subject, htmlBody);
    }
}
