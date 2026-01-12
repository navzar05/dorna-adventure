package ro.atm.backend.domain.activity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityTimeSlot;

import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActivityTimeSlotRequest {

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Boolean active;

    public ActivityTimeSlot toEntity(Activity activity) {
        return ActivityTimeSlot.builder()
                .activity(activity)
                .startTime(this.startTime)
                .endTime(this.endTime)
                .active(this.active != null ? this.active : true)
                .build();
    }

    public void updateEntity(ActivityTimeSlot timeSlot) {
        timeSlot.setStartTime(this.startTime);
        timeSlot.setEndTime(this.endTime);
        timeSlot.setActive(this.active != null ? this.active : true);
    }
}
