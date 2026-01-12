package ro.atm.backend.domain.settings.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.domain.settings.dto.SettingsDTO;
import ro.atm.backend.domain.settings.entity.Settings;
import ro.atm.backend.domain.settings.repository.SettingsRepository;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsRepository settingsRepository;

    public SettingsDTO getSettings() {
        // Always return the first (and only) settings record
        Settings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(this::createDefaultSettings);

        return SettingsDTO.fromEntity(settings);
    }

    @Transactional
    public SettingsDTO updateSettings(SettingsDTO settingsDTO) {
        Settings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(this::createDefaultSettings);

        // Update fields
        settings.setCompanyName(settingsDTO.getCompanyName());
        settings.setCompanyDescription(settingsDTO.getCompanyDescription());
        settings.setEmail(settingsDTO.getEmail());
        settings.setPhone(settingsDTO.getPhone());
        settings.setAddress(settingsDTO.getAddress());
        settings.setFacebookUrl(settingsDTO.getFacebookUrl());
        settings.setInstagramUrl(settingsDTO.getInstagramUrl());
        settings.setTwitterUrl(settingsDTO.getTwitterUrl());
        settings.setAboutUsTitle(settingsDTO.getAboutUsTitle());
        settings.setAboutUsContent(settingsDTO.getAboutUsContent());

        // Convert media URLs list to JSON string
        if (settingsDTO.getAboutUsMediaUrls() != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String mediaUrlsJson = objectMapper.writeValueAsString(settingsDTO.getAboutUsMediaUrls());
                settings.setAboutUsMediaUrls(mediaUrlsJson);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                settings.setAboutUsMediaUrls("[]");
            }
        } else {
            settings.setAboutUsMediaUrls(null);
        }

        Settings saved = settingsRepository.save(settings);
        return SettingsDTO.fromEntity(saved);
    }

    private Settings createDefaultSettings() {
        Settings defaultSettings = Settings.builder()
                .companyName("Dorna Adventure")
                .companyDescription("Descoperă natura sălbatică a Bucovinei cu aventurile noastre!")
                .email("info@dornaadventure.ro")
                .phone("+40 123 456 789")
                .address("Bucovina, România")
                .facebookUrl("https://facebook.com")
                .instagramUrl("https://instagram.com")
                .twitterUrl("https://twitter.com")
                .aboutUsTitle("About Us")
                .aboutUsContent("Welcome to Dorna Adventure!")
                .aboutUsMediaUrls("[]")
                .build();

        return settingsRepository.save(defaultSettings);
    }
}
