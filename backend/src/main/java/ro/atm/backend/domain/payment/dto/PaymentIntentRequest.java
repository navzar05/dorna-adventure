package ro.atm.backend.domain.payment.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentIntentRequest {
    private Long bookingId;
    private PaymentType paymentType; // DEPOSIT, REMAINING, FULL
    private BigDecimal amount;

    public enum PaymentType {
        DEPOSIT,
        REMAINING,
        FULL
    }
}
