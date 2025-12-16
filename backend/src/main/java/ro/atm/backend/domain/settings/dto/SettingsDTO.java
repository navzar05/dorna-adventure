package ro.atm.backend.domain.settings.dto;

import lombok.*;
import ro.atm.backend.domain.settings.entity.Settings;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SettingsDTO {
    private Long id;
    private String companyName;
    private String companyDescription;
    private String email;
    private String phone;
    private String address;
    private String facebookUrl;
    private String instagramUrl;
    private String twitterUrl;

    public static SettingsDTO fromEntity(Settings settings) {
        return SettingsDTO.builder()
                .id(settings.getId())
                .companyName(settings.getCompanyName())
                .companyDescription(settings.getCompanyDescription())
                .email(settings.getEmail())
                .phone(settings.getPhone())
                .address(settings.getAddress())
                .facebookUrl(settings.getFacebookUrl())
                .instagramUrl(settings.getInstagramUrl())
                .twitterUrl(settings.getTwitterUrl())
                .build();
    }

    public Settings toEntity() {
        return Settings.builder()
                .id(this.id)
                .companyName(this.companyName)
                .companyDescription(this.companyDescription)
                .email(this.email)
                .phone(this.phone)
                .address(this.address)
                .facebookUrl(this.facebookUrl)
                .instagramUrl(this.instagramUrl)
                .twitterUrl(this.twitterUrl)
                .build();
    }
}
