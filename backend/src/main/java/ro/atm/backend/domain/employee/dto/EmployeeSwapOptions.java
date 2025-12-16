package ro.atm.backend.domain.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ro.atm.backend.domain.booking.dto.CompatibleBookingDTO;

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