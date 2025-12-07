// src/main/java/ro/atm/backend/dto/ChangePasswordRequest.java
package ro.atm.backend.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}