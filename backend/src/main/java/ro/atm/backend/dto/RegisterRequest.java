package ro.atm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    public String username;
    public String password;
    public String confirmPassword;
    public String firstName;
    public String lastName;
    public String phoneNumber;
}
