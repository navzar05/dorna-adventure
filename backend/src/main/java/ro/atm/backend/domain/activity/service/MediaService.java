package ro.atm.backend.domain.activity.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.Media;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.activity.repository.MediaRepository;
import ro.atm.backend.infrastructure.storage.R2StorageService;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MediaService {
    private final R2StorageService storageService;
    private final MediaRepository mediaRepository;
    private final ActivityRepository activityRepository;

    @Transactional
    public String uploadFile(MultipartFile file,
                             String folder,
                             Long activityId) throws IOException {
        validateFile(file);

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + activityId));

        String url = storageService.uploadFile(file, folder);

        Media.MediaType mediaType = determineMediaType(file.getContentType());

        Media media = new Media();
        media.setMediaType(mediaType);
        media.setActivity(activity);
        media.setUrl(url);

        mediaRepository.save(media);

        return url;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Max file size: 50MB for images, 500MB for videos
        long maxSize = file.getContentType().startsWith("image/") ? 50_000_000 : 500_000_000;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds limit");
        }

        // Allowed types
        String contentType = file.getContentType();
        List<String> allowedTypes = List.of(
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/quicktime"
        );

        if (!allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }
    }

    private Media.MediaType determineMediaType(String contentType) {
        if (contentType == null) {
            throw new IllegalArgumentException("Content type cannot be null");
        }

        if (contentType.startsWith("image/")) {
            return Media.MediaType.IMAGE;
        } else if (contentType.startsWith("video/")) {
            return Media.MediaType.VIDEO;
        } else {
            throw new IllegalArgumentException("Unsupported media type: " + contentType);
        }
    }

    public List<Media> getMediaByActivityId(Long activityId) {
        return mediaRepository.findByActivityId(activityId);
    }

    @Transactional
    public void deleteMedia(Long mediaId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media not found with id: " + mediaId));

        // Extract filename from URL
        String fileName = extractFileNameFromUrl(media.getUrl());

        // Delete from R2
        storageService.deleteFile(fileName);

        // Delete from database
        mediaRepository.delete(media);
    }

    private String extractFileNameFromUrl(String url) {
        // Extract filename from URL like: https://pub-xxx.r2.dev/images/uuid-filename.jpg
        String[] parts = url.split("/");
        return parts[parts.length - 2] + "/" + parts[parts.length - 1]; // folder/filename
    }
}