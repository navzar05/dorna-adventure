package ro.atm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeSwapRequest {
    private Long booking1Id;
    private Long booking2Id;
}