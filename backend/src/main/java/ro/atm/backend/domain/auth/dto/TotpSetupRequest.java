package ro.atm.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TotpSetupRequest {
    private Long userId;
    private String verificationCode; // Code from authenticator app to verify setup
}
