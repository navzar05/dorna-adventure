package ro.atm.backend.domain.employee.dto;


import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeWorkHourBulkCreateDTO {

    private List<LocalDate> workDates;

    private LocalTime startTime;

    private LocalTime endTime;

    private Boolean isAvailable;
}