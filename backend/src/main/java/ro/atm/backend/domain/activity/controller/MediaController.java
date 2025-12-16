package ro.atm.backend.domain.activity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ro.atm.backend.domain.activity.entity.Media;
import ro.atm.backend.domain.activity.service.MediaService;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("activityId") Long activityId,
            @RequestParam(value = "folder", defaultValue = "images") String folder) {

        try {
            String url = mediaService.uploadFile(file, folder, activityId);
            return ResponseEntity.ok(Map.of("url", url, "message", "File uploaded successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<Media>> getMediaByActivity(@PathVariable Long activityId) {
        List<Media> mediaList = mediaService.getMediaByActivityId(activityId);
        return ResponseEntity.ok(mediaList);
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Map<String, String>> deleteMedia(@PathVariable Long mediaId) {
        try {
            mediaService.deleteMedia(mediaId);
            return ResponseEntity.ok(Map.of("message", "Media deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}