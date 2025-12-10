package ro.atm.backend.dto;

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