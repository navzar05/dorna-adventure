package ro.atm.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender emailSender;

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
    public void sendHtmlMessage(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            emailSender.send(message);
            log.info("📧 HTML Email sent to {}", to);
        } catch (MessagingException e) {
            log.error("❌ Failed to send HTML email to {}", to, e);
        }
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