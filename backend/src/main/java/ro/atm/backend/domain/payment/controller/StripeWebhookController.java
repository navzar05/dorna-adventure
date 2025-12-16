package ro.atm.backend.domain.payment.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.payment.service.PaymentService;

@RestController
@RequestMapping("/api/v1/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final PaymentService paymentService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Webhook signature verification failed", e);
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        // --- FIX STARTS HERE ---
        // 1. Get the deserializer
        EventDataObjectDeserializer dataDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = null;

        // 2. Try standard deserialization (safe mode)
        if (dataDeserializer.getObject().isPresent()) {
            stripeObject = dataDeserializer.getObject().get();
        } else {
            // 3. Fallback: Force deserialization even if versions don't match
            // This fixes the "null" issue with version 2025-11-17.clover
            try {
                stripeObject = dataDeserializer.deserializeUnsafe();
                log.warn("⚠️ Version mismatch! Forced deserialization for API version: {}", event.getApiVersion());
            } catch (Exception e) {
                log.error("❌ Could not deserialize event data: {}", e.getMessage());
            }
        }
        // --- FIX ENDS HERE ---

        if (stripeObject == null) {
            // If we still can't get the object, we can't process the event
            return ResponseEntity.ok("Ignored: Unable to deserialize");
        }

        switch (event.getType()) {
            case "payment_intent.succeeded":
                // 4. Cast the stripeObject we safely retrieved above
                if (stripeObject instanceof PaymentIntent paymentIntent) {
                    log.info("💰 Payment succeeded: {}", paymentIntent.getId());
                    paymentService.handlePaymentSuccess(paymentIntent.getId());
                }
                break;

            case "payment_intent.payment_failed":
                if (stripeObject instanceof PaymentIntent failedIntent) {
                    log.error("❌ Payment failed: {}", failedIntent.getId());
                    String reason = failedIntent.getLastPaymentError() != null
                            ? failedIntent.getLastPaymentError().getMessage()
                            : "Unknown error";
                    paymentService.handlePaymentFailure(failedIntent.getId(), reason);
                }
                break;

            case "payment_intent.created":
            case "payment_intent.processing":
            case "payment_intent.requires_action":
                log.debug("Payment lifecycle event received: {}", event.getType());
                break;

            default:
                log.warn("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok("Success");
    }
}