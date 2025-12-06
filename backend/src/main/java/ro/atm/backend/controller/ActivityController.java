package ro.atm.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.dto.ActivityDTO;
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

    @GetMapping
    public ResponseEntity<List<ActivityDTO>> getAllActiveActivities() {
        List<ActivityDTO> activities = activityRepository.findByActiveTrue()
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

    @PostMapping
    public ResponseEntity<ActivityDTO> createActivity(@RequestBody Activity activity) {
        // Validate category exists
        if (activity.getCategory() != null && activity.getCategory().getId() != null) {
            ActivityCategory category = categoryRepository.findById(activity.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            activity.setCategory(category);
        }

        Activity saved = activityRepository.save(activity);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ActivityDTO.fromEntity(saved));
    }
}