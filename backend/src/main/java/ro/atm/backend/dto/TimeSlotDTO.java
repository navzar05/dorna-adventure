package ro.atm.backend.dto;

import lombok.*;

import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TimeSlotDTO {
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean available;
}