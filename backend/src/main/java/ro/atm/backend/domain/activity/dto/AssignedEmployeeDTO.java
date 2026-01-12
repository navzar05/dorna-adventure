package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.auth.entity.User;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssignedEmployeeDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String username;

    public static AssignedEmployeeDTO fromUser(User user) {
        return AssignedEmployeeDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .build();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
