package ro.atm.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingRequest {
    private Long activityId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private Integer numberOfParticipants;
    private String notes;
}