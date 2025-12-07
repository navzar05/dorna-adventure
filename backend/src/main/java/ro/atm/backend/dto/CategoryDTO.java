package ro.atm.backend.dto;

import lombok.*;
import ro.atm.backend.entity.ActivityCategory;

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

    public static CategoryDTO fromEntity(ActivityCategory category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .iconUrl(category.getIconUrl())
                .activityCount(category.getActivities() != null ? category.getActivities().size() : 0)
                .build();
    }
}