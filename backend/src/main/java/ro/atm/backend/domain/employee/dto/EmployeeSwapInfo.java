package ro.atm.backend.domain.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeSwapInfo {
    private Long conflictingBookingId;
    private String conflictingBookingActivity;
    private String currentEmployeeName;
    private String newEmployeeName;
    private String location;
    private String category;
    private String startTime;
    private String endTime;
    private boolean canSwap;
    private String reason; // Reason why swap is not possible
}