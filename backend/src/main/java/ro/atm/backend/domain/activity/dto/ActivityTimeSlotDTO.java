package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.activity.entity.ActivityTimeSlot;

import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActivityTimeSlotDTO {
    private Long id;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean active;

    public static ActivityTimeSlotDTO fromEntity(ActivityTimeSlot timeSlot) {
        return ActivityTimeSlotDTO.builder()
                .id(timeSlot.getId())
                .startTime(timeSlot.getStartTime())
                .endTime(timeSlot.getEndTime())
                .active(timeSlot.getActive())
                .build();
    }
}
