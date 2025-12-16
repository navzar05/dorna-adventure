package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.activity.entity.ActivityCategory;

import java.util.Collections; // Import this if you want to use Collections.emptyList()

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private String slug;
    private String iconUrl;
    private Integer activityCount;
    private Integer maxParticipantsPerGuide;
    private boolean active;

    public static CategoryDTO fromEntity(ActivityCategory category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .iconUrl(category.getIconUrl())
                .activityCount(category.getActivities() != null ? category.getActivities().size() : 0)
                .maxParticipantsPerGuide(category.getMaxParticipantsPerGuide())
                .active(category.getActive())
                .build();
    }
}