package ro.atm.backend.domain.payment.controller;

import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.payment.dto.PaymentDTO;
import ro.atm.backend.domain.payment.dto.PaymentIntentRequest;
import ro.atm.backend.domain.payment.dto.PaymentIntentResponse;
import ro.atm.backend.domain.payment.service.PaymentService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${stripe.publishable.key}")
    private String stripePublishableKey;

    // Get Stripe publishable key for frontend
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getStripeConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("publishableKey", stripePublishableKey);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @RequestBody PaymentIntentRequest request) throws StripeException {
        return ResponseEntity.ok(paymentService.createPaymentIntent(request));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<PaymentDTO>> getBookingPayments(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getBookingPayments(bookingId));
    }

    @PostMapping("/booking/{bookingId}/mark-cash")
    public ResponseEntity<Void> markRemainingAsCash(@PathVariable Long bookingId) {
        paymentService.markRemainingAsCash(bookingId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/booking/{bookingId}/record-cash")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<Void> recordCashPayment(@PathVariable Long bookingId) {
        paymentService.recordCashPayment(bookingId);
        return ResponseEntity.ok().build();
    }
}
