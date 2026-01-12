package ro.atm.backend.domain.settings.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import ro.atm.backend.domain.settings.entity.Settings;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SettingsDTO {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private Long id;
    private String companyName;
    private String companyDescription;
    private String email;
    private String phone;
    private String address;
    private String facebookUrl;
    private String instagramUrl;
    private String twitterUrl;
    private String aboutUsTitle;
    private String aboutUsContent;
    private List<String> aboutUsMediaUrls;

    public static SettingsDTO fromEntity(Settings settings) {
        List<String> mediaUrls = new ArrayList<>();
        if (settings.getAboutUsMediaUrls() != null && !settings.getAboutUsMediaUrls().isEmpty()) {
            try {
                mediaUrls = objectMapper.readValue(
                    settings.getAboutUsMediaUrls(),
                    new TypeReference<List<String>>() {}
                );
            } catch (JsonProcessingException e) {
                // If parsing fails, return empty list
                mediaUrls = new ArrayList<>();
            }
        }

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
                .aboutUsTitle(settings.getAboutUsTitle())
                .aboutUsContent(settings.getAboutUsContent())
                .aboutUsMediaUrls(mediaUrls)
                .build();
    }

    public Settings toEntity() {
        String mediaUrlsJson = null;
        if (this.aboutUsMediaUrls != null && !this.aboutUsMediaUrls.isEmpty()) {
            try {
                mediaUrlsJson = objectMapper.writeValueAsString(this.aboutUsMediaUrls);
            } catch (JsonProcessingException e) {
                // If serialization fails, store empty array
                mediaUrlsJson = "[]";
            }
        }

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
                .aboutUsTitle(this.aboutUsTitle)
                .aboutUsContent(this.aboutUsContent)
                .aboutUsMediaUrls(mediaUrlsJson)
                .build();
    }
}
