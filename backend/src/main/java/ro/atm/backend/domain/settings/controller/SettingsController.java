package ro.atm.backend.domain.settings.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ro.atm.backend.domain.settings.dto.SettingsDTO;
import ro.atm.backend.domain.settings.service.SettingsService;
import ro.atm.backend.infrastructure.storage.R2StorageService;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final R2StorageService storageService;

    @GetMapping
    public ResponseEntity<SettingsDTO> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SettingsDTO> updateSettings(@RequestBody SettingsDTO settingsDTO) {
        return ResponseEntity.ok(settingsService.updateSettings(settingsDTO));
    }

    @PostMapping("/upload-media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "about-us") String folder) {

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "File is empty"));
            }

            // Max file size: 50MB for images
            if (file.getSize() > 50_000_000) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "File size exceeds limit (50MB)"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Only image files are allowed"));
            }

            // Upload to R2
            String url = storageService.uploadFile(file, folder);

            return ResponseEntity.ok(Map.of("url", url, "message", "File uploaded successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
}
