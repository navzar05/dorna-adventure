package ro.atm.backend.domain.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateEmployeeRequest {
    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean enabled;
    private List<String> roles;

    // TOTP fields for admin creation
    private String totpSecret;
    private Boolean totpEnabled;
}