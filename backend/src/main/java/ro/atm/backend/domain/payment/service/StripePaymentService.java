package ro.atm.backend.domain.payment.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ro.atm.backend.common.exception.StripeIntegrationException;
import ro.atm.backend.domain.booking.entity.Booking;

import java.math.BigDecimal;

/**
 * Service responsible for Stripe API integration.
 * Handles all direct interactions with the Stripe payment gateway.
 */
@Service
@Slf4j
public class StripePaymentService {

    @Value("${stripe.currency}")
    private String currency;

    /**
     * Creates a Stripe PaymentIntent for processing a payment.
     *
     * @param booking The booking for which the payment is being made
     * @param amount The amount to charge
     * @return The created PaymentIntent
     * @throws StripeIntegrationException if the Stripe API call fails
     */
    public PaymentIntent createPaymentIntent(Booking booking, BigDecimal amount) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount.multiply(BigDecimal.valueOf(100)).longValue()) // Convert to cents
                    .setCurrency(currency)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .putMetadata("bookingId", booking.getId().toString())
                    .putMetadata("activityName", booking.getActivity().getName())
                    .putMetadata("userName", booking.getUser().getFirstName() + " " + booking.getUser().getLastName())
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);
            log.info("Created Stripe PaymentIntent: {} for booking: {}", paymentIntent.getId(), booking.getId());
            return paymentIntent;
        } catch (StripeException e) {
            log.error("Failed to create Stripe PaymentIntent for booking: {}", booking.getId(), e);
            throw new StripeIntegrationException("Failed to create payment intent: " + e.getMessage(), e);
        }
    }

    /**
     * Confirms a Stripe PaymentIntent.
     *
     * @param paymentIntentId The ID of the PaymentIntent to confirm
     * @return The confirmed PaymentIntent
     * @throws StripeIntegrationException if the Stripe API call fails
     */
    public PaymentIntent confirmPaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            PaymentIntent confirmedIntent = paymentIntent.confirm();
            log.info("Confirmed Stripe PaymentIntent: {}", paymentIntentId);
            return confirmedIntent;
        } catch (StripeException e) {
            log.error("Failed to confirm Stripe PaymentIntent: {}", paymentIntentId, e);
            throw new StripeIntegrationException("Failed to confirm payment intent: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieves a Stripe PaymentIntent by ID.
     *
     * @param paymentIntentId The ID of the PaymentIntent to retrieve
     * @return The retrieved PaymentIntent
     * @throws StripeIntegrationException if the Stripe API call fails
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            log.debug("Retrieved Stripe PaymentIntent: {}", paymentIntentId);
            return paymentIntent;
        } catch (StripeException e) {
            log.error("Failed to retrieve Stripe PaymentIntent: {}", paymentIntentId, e);
            throw new StripeIntegrationException("Failed to retrieve payment intent: " + e.getMessage(), e);
        }
    }

    /**
     * Cancels a Stripe PaymentIntent.
     *
     * @param paymentIntentId The ID of the PaymentIntent to cancel
     * @return The cancelled PaymentIntent
     * @throws StripeIntegrationException if the Stripe API call fails
     */
    public PaymentIntent cancelPaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            PaymentIntent cancelledIntent = paymentIntent.cancel();
            log.info("Cancelled Stripe PaymentIntent: {}", paymentIntentId);
            return cancelledIntent;
        } catch (StripeException e) {
            log.error("Failed to cancel Stripe PaymentIntent: {}", paymentIntentId, e);
            throw new StripeIntegrationException("Failed to cancel payment intent: " + e.getMessage(), e);
        }
    }
}
