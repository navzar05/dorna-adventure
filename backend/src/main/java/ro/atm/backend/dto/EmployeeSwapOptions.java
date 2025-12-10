package ro.atm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeSwapOptions {
    private String currentEmployeeName;
    private String newEmployeeName;
    private String location;
    private String category;
    private String startTime;
    private String endTime;
    private List<CompatibleBookingDTO> compatibleBookings;
    private boolean hasCompatibleBookings;
    private String reason; // Reason if no compatible bookings
}