// src/main/java/ro/atm/backend/dto/EmployeeDTO.java
package ro.atm.backend.domain.employee.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean enabled;
    private List<String> roles;
    private String totpSecret;
    private Boolean totpEnabled;

}