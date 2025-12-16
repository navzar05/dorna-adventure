package ro.atm.backend.domain.activity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.activity.dto.CategoryDTO;
import ro.atm.backend.domain.activity.entity.ActivityCategory;
import ro.atm.backend.domain.activity.repository.ActivityCategoryRepository;
import ro.atm.backend.domain.activity.repository.ActivityRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final ActivityCategoryRepository categoryRepository;
    private final ActivityRepository activityRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = categoryRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(CategoryDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(CategoryDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoryDTO> getCategoryBySlug(@PathVariable String slug) {
        return categoryRepository.findBySlug(slug)
                .map(CategoryDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody ActivityCategory category) {
        // Generate slug from name if not provided
        if (category.getSlug() == null || category.getSlug().isEmpty()) {
            category.setSlug(generateSlug(category.getName()));
        }

        ActivityCategory saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CategoryDTO.fromEntity(saved));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable Long id,
            @RequestBody ActivityCategory categoryDetails) {

        return categoryRepository.findById(id)
                .map(category -> {
                    category.setName(categoryDetails.getName());
                    category.setDescription(categoryDetails.getDescription());

                    if (categoryDetails.getSlug() != null && !categoryDetails.getSlug().isEmpty()) {
                        category.setSlug(categoryDetails.getSlug());
                    } else {
                        category.setSlug(generateSlug(categoryDetails.getName()));
                    }

                    category.setIconUrl(categoryDetails.getIconUrl());
                    category.setActive(categoryDetails.getActive());
                    category.setDisplayOrder(categoryDetails.getDisplayOrder());

                    ActivityCategory updated = categoryRepository.save(category);
                    return ResponseEntity.ok(CategoryDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(category -> {
                    long linkedActivities = activityRepository.countByCategoryId(id);
                    if (linkedActivities > 0) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).<Void>build();
                    }

                    categoryRepository.delete(category);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}