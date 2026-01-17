package ro.atm.backend.infrastructure.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final Resend resend;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public EmailService(@Value("${resend.api.key}") String apiKey) {
        this.resend = new Resend(apiKey);
    }

    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .text(text)
                    .build();

            CreateEmailResponse data = resend.emails().send(params);
            log.info("📧 Email trimis către {} - ID: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("❌ Eroare la trimiterea emailului către {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendAccountVerificationEmail(String to, String name, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String subject = "Verifică-ți contul Dorna Adventure";

        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Bun venit la Dorna Adventure!</h2>
                <p>Bună %s,</p>
                <p>Îți mulțumim că te-ai înregistrat. Te rugăm să apeși butonul de mai jos pentru a-ți verifica contul:</p>
                <a href="%s" style="background-color: #2d6a4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verifică Contul</a>
                <p>Dacă butonul nu funcționează, copiază și lipește acest link:</p>
                <p><small>%s</small></p>
                <br>
                <p>Cu respect,<br>Echipa Dorna Adventure</p>
            </div>
            """, name, verificationLink, verificationLink);

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendEmployeeAccountCreatedEmail(String to, String name, String username, String temporaryPassword, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String subject = "Contul tău de angajat Dorna Adventure";

        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Bun venit în echipa Dorna Adventure!</h2>
                <p>Bună %s,</p>
                <p>A fost creat un cont de angajat pentru tine. Iată datele tale de autentificare:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Nume utilizator:</strong> %s</p>
                    <p style="margin: 5px 0;"><strong>Parolă temporară:</strong> <code style="background-color: #fff; padding: 5px; border-radius: 3px;">%s</code></p>
                </div>
                <p><strong>Important:</strong> Vei fi nevoit să schimbi această parolă la prima autentificare.</p>
                <p>Înainte de a te putea autentifica, te rugăm să îți verifici contul apăsând butonul de mai jos:</p>
                <a href="%s" style="background-color: #2d6a4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verifică Contul</a>
                <p>Dacă butonul nu funcționează, copiază și lipește acest link:</p>
                <p><small>%s</small></p>
                <br>
                <p>Cu respect,<br>Echipa Dorna Adventure</p>
            </div>
            """, name, username, temporaryPassword, verificationLink, verificationLink);

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendHtmlMessage(String to, String subject, String htmlBody) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .html(htmlBody)
                    .build();

            CreateEmailResponse data = resend.emails().send(params);
            log.info("📧 Email HTML trimis către {} - ID: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("Eroare la trimiterea emailului HTML către {}. Subiect: {}. Eroare: {}", to, subject, e.getMessage());
            log.warn("CONȚINUT EMAIL (netrimis din cauza erorii):\nCătre: {}\nSubiect: {}\nCorp: {}", to, subject, htmlBody);
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String subject = "Resetează-ți Parola - Dorna Adventure";

        String htmlBody = "<html>" +
                "<body>" +
                "<h2>Bună, " + name + "!</h2>" +
                "<p>Ai solicitat resetarea parolei.</p>" +
                "<p>Apasă pe linkul de mai jos pentru a seta o parolă nouă:</p>" +
                "<a href=\"" + verificationLink + "\">Resetează Parola</a>" +
                "<p>Acest link expiră în 15 minute.</p>" +
                "<p>Dacă nu ai solicitat acest lucru, te rugăm să ignori acest email.</p>" +
                "<br>" +
                "<p>Cu respect,<br>Echipa Dorna Adventure</p>" +
                "</body>" +
                "</html>";

        sendHtmlMessage(to, subject, htmlBody);
    }

    @Async
    public void sendPaymentConfirmation(String to, String userName, String amount, String bookingId) {
        String subject = "Confirmare Plată - Rezervare #" + bookingId;
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2d6a4f;">Plată Reușită!</h2>
                <p>Bună %s,</p>
                <p>Am primit plata ta de <strong>€%s</strong> pentru rezervarea <strong>#%s</strong>.</p>
                <p>Abia așteptăm să te vedem!</p>
                <br>
                <p>Cu respect,<br>Echipa Dorna Adventure</p>
            </div>
            """, userName, amount, bookingId);

        sendHtmlMessage(to, subject, htmlBody);
    }
}