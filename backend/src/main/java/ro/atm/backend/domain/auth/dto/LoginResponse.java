package ro.atm.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ro.atm.backend.domain.user.dto.UserDTO;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private UserDTO user;
    private boolean requiresTotp; // If true, client should prompt for TOTP
    private String tempToken; // Temporary token for TOTP verification
}
