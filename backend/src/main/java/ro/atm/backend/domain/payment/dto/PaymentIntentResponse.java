package ro.atm.backend.domain.payment.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentIntentResponse {
    private String clientSecret;
    private Long paymentId;
    private String paymentIntentId;
}
