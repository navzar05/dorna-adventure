package ro.atm.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.dto.SettingsDTO;
import ro.atm.backend.entity.Settings;
import ro.atm.backend.repo.SettingsRepository;

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
        settings.setAboutUsUrl(settingsDTO.getAboutUsUrl());
        settings.setTermsUrl(settingsDTO.getTermsUrl());
        settings.setPrivacyUrl(settingsDTO.getPrivacyUrl());

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
                .aboutUsUrl("/about")
                .termsUrl("/terms")
                .privacyUrl("/privacy")
                .build();

        return settingsRepository.save(defaultSettings);
    }
}