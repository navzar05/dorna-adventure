// src/main/java/ro/atm/backend/dto/ActivityRequest.java
package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityCategory;
import ro.atm.backend.domain.activity.entity.LocationDetails;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActivityRequest {
    private String name;
    private String description;
    private Integer minParticipants;
    private Integer maxParticipants;
    private BigDecimal pricePerPerson;
    private BigDecimal depositPercent;
    private Integer durationMinutes;
    private String location;
    private LocationDetailsDTO locationDetails;
    private Long categoryId;
    private Boolean active;
    private Boolean employeeSelectionEnabled;
    private List<Long> employeeIds;

    public Activity toEntity(ActivityCategory category) {
        Activity activity = Activity.builder()
                .name(this.name)
                .description(this.description)
                .minParticipants(this.minParticipants)
                .maxParticipants(this.maxParticipants)
                .pricePerPerson(this.pricePerPerson)
                .depositPercent(this.depositPercent)
                .durationMinutes(this.durationMinutes)
                .location(this.location)
                .category(category)
                .active(this.active != null ? this.active : true)
                .employeeSelectionEnabled(this.employeeSelectionEnabled)
                .build();

        // Set location details if provided
        if (this.locationDetails != null) {
            activity.setLocationDetails(this.locationDetails.toEntity());
        }

        return activity;
    }

    public void updateEntity(Activity activity, ActivityCategory category) {
        activity.setName(this.name);
        activity.setDescription(this.description);
        activity.setMinParticipants(this.minParticipants);
        activity.setMaxParticipants(this.maxParticipants);
        activity.setPricePerPerson(this.pricePerPerson);
        activity.setDepositPercent(this.depositPercent);
        activity.setDurationMinutes(this.durationMinutes);
        activity.setLocation(this.location);
        activity.setCategory(category);
        activity.setActive(this.active != null ? this.active : true);
        activity.setEmployeeSelectionEnabled(this.employeeSelectionEnabled);

        // Update location details
        if (this.locationDetails != null) {
            activity.setLocationDetails(this.locationDetails.toEntity());
        } else {
            activity.setLocationDetails(null);
        }
    }
}