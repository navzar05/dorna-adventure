package ro.atm.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.dto.ActivityDTO;
import ro.atm.backend.dto.ActivityRequest;
import ro.atm.backend.entity.Activity;
import ro.atm.backend.entity.ActivityCategory;
import ro.atm.backend.repo.ActivityCategoryRepository;
import ro.atm.backend.repo.ActivityRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final ActivityCategoryRepository categoryRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<ActivityDTO>> getAllActiveActivities() {
        List<ActivityDTO> activities = activityRepository.findByActiveTrue()
                .stream()
                .map(ActivityDTO::fromEntity)
                .toList();
        return ResponseEntity.status(HttpStatus.OK)
                .body(activities);
    }

    @GetMapping
    public ResponseEntity<List<ActivityDTO>> getAllActivities() {
        List<ActivityDTO> activities = activityRepository.findAll()
                .stream()
                .map(ActivityDTO::fromEntity)
                .toList();
        return ResponseEntity.status(HttpStatus.OK)
                .body(activities);
    }


    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ActivityDTO>> getActivitiesByCategory(@PathVariable Long categoryId) {
        List<ActivityDTO> activities = activityRepository.findByCategoryIdAndActiveTrue(categoryId)
                .stream()
                .map(ActivityDTO::fromEntity)
                .toList();
        return ResponseEntity.status(HttpStatus.OK)
                .body(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDTO> getActivityById(@PathVariable Long id) {
        return activityRepository.findById(id)
                .map(ActivityDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ActivityDTO> createActivity(@RequestBody ActivityRequest request) {
        // Validate and get category
        ActivityCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
        }

        // Convert request to entity
        Activity activity = request.toEntity(category);

        // Save activity
        Activity saved = activityRepository.save(activity);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ActivityDTO.fromEntity(saved));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ActivityDTO> updateActivity(
            @PathVariable Long id,
            @RequestBody ActivityRequest request) {

        return activityRepository.findById(id)
                .map(existingActivity -> {
                    // Validate and get category
                    ActivityCategory category = null;
                    if (request.getCategoryId() != null) {
                        category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
                    }

                    // Update entity from request
                    request.updateEntity(existingActivity, category);

                    // Save updated activity
                    Activity updated = activityRepository.save(existingActivity);
                    return ResponseEntity.ok(ActivityDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        return activityRepository.findById(id)
                .map(activity -> {
                    activityRepository.delete(activity);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}