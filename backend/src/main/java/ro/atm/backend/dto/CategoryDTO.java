package ro.atm.backend.dto;

import lombok.*;
import ro.atm.backend.entity.ActivityCategory;

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
                .activityCount(category.getActivities().size())
                .build();
    }
}