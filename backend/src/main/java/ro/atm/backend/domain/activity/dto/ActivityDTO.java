package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.activity.entity.Activity;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActivityDTO {
    private Long id;
    private String name;
    private String description;
    private Integer minParticipants;
    private Integer maxParticipants;
    private BigDecimal pricePerPerson;
    private BigDecimal depositAmount;
    private BigDecimal depositPercent;
    private String duration; // Formatted duration
    private Integer durationMinutes;
    private String location;
    private LocationDetailsDTO locationDetails; // Add this field
    private CategoryDTO category;
    private Boolean active;
    private Boolean employeeSelectionEnabled;
    private List<String> imageUrls;
    private List<String> videoUrls;
    private List<ActivityTimeSlotDTO> timeSlots;
    private List<AssignedEmployeeDTO> assignedEmployees;

    public static ActivityDTO fromEntity(Activity activity) {
        return ActivityDTO.builder()
                .id(activity.getId())
                .name(activity.getName())
                .description(activity.getDescription())
                .minParticipants(activity.getMinParticipants())
                .maxParticipants(activity.getMaxParticipants())
                .pricePerPerson(activity.getPricePerPerson())
                .depositAmount(activity.calculateDeposit())
                .depositPercent(activity.getDepositPercent())
                .duration(activity.getFormattedDuration())
                .durationMinutes(activity.getDurationMinutes())
                .location(activity.getLocation())
                .locationDetails(LocationDetailsDTO.fromEntity(activity.getLocationDetails())) // Add this
                .category(activity.getCategory() != null ? CategoryDTO.fromEntity(activity.getCategory()) : null)
                .active(activity.getActive())
                .employeeSelectionEnabled(activity.getEmployeeSelectionEnabled())
                .imageUrls(activity.getMediaList().stream()
                        .filter(m -> m.getMediaType() == ro.atm.backend.domain.activity.entity.Media.MediaType.IMAGE)
                        .map(ro.atm.backend.domain.activity.entity.Media::getUrl)
                        .toList())
                .videoUrls(activity.getMediaList().stream()
                        .filter(m -> m.getMediaType() == ro.atm.backend.domain.activity.entity.Media.MediaType.VIDEO)
                        .map(ro.atm.backend.domain.activity.entity.Media::getUrl)
                        .toList())
                .timeSlots(activity.getTimeSlots().stream()
                        .map(ActivityTimeSlotDTO::fromEntity)
                        .toList())
                .assignedEmployees(activity.getActivityEmployees().stream()
                        .filter(ae -> ae.getActive())
                        .map(ae -> AssignedEmployeeDTO.fromUser(ae.getEmployee()))
                        .toList())
                .build();
    }
}