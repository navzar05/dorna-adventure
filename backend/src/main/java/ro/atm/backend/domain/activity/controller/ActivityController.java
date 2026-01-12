package ro.atm.backend.domain.activity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.activity.dto.ActivityDTO;
import ro.atm.backend.domain.activity.dto.ActivityRequest;
import ro.atm.backend.domain.activity.dto.ActivityTimeSlotDTO;
import ro.atm.backend.domain.activity.dto.ActivityTimeSlotRequest;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityCategory;
import ro.atm.backend.domain.activity.repository.ActivityCategoryRepository;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.activity.service.ActivityTimeSlotService;
import ro.atm.backend.domain.booking.service.BookingService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final BookingService bookingService;
    private final ActivityTimeSlotService timeSlotService;
    private final ro.atm.backend.domain.activity.service.ActivityEmployeeService activityEmployeeService;

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

        // Handle employee assignments if provided
        if (request.getEmployeeSelectionEnabled() != null && request.getEmployeeSelectionEnabled()) {
            if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
                activityEmployeeService.assignEmployees(saved.getId(), request.getEmployeeIds());
            }
        }

        // Reload to get assigned employees
        Activity reloaded = activityRepository.findById(saved.getId()).orElse(saved);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ActivityDTO.fromEntity(reloaded));
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

                    // Handle employee assignments if provided
                    if (request.getEmployeeSelectionEnabled() != null && request.getEmployeeSelectionEnabled()) {
                        if (request.getEmployeeIds() != null) {
                            // Remove all existing assignments and add new ones
                            activityEmployeeService.getAssignedEmployees(id).forEach(emp -> {
                                try {
                                    activityEmployeeService.removeEmployee(id, emp.getId());
                                } catch (Exception e) {
                                    // Ignore if already removed
                                }
                            });

                            if (!request.getEmployeeIds().isEmpty()) {
                                activityEmployeeService.assignEmployees(id, request.getEmployeeIds());
                            }
                        }
                    } else {
                        // If employee selection is disabled, remove all assignments
                        activityEmployeeService.getAssignedEmployees(id).forEach(emp -> {
                            try {
                                activityEmployeeService.removeEmployee(id, emp.getId());
                            } catch (Exception e) {
                                // Ignore if already removed
                            }
                        });
                    }

                    // Reload to get updated assigned employees
                    Activity reloaded = activityRepository.findById(id).orElse(updated);

                    return ResponseEntity.ok(ActivityDTO.fromEntity(reloaded));
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

    @GetMapping("/{id}/availability/month")
    public ResponseEntity<List<String>> getMonthlyAvailability(
            @PathVariable Long id,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("participants") Integer participants) {

        List<String> availableDates = bookingService.getAvailableDatesForMonth(id, date, participants);

        return ResponseEntity.ok(availableDates);
    }

    // ==================== Time Slot Management Endpoints ====================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/time-slots")
    public ResponseEntity<List<ActivityTimeSlotDTO>> getActivityTimeSlots(@PathVariable Long id) {
        List<ActivityTimeSlotDTO> timeSlots = timeSlotService.getActivityTimeSlots(id);
        return ResponseEntity.ok(timeSlots);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/time-slots")
    public ResponseEntity<ActivityTimeSlotDTO> createTimeSlot(
            @PathVariable Long id,
            @RequestBody ActivityTimeSlotRequest request) {
        ActivityTimeSlotDTO created = timeSlotService.createTimeSlot(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/time-slots/{slotId}")
    public ResponseEntity<ActivityTimeSlotDTO> updateTimeSlot(
            @PathVariable Long id,
            @PathVariable Long slotId,
            @RequestBody ActivityTimeSlotRequest request) {
        ActivityTimeSlotDTO updated = timeSlotService.updateTimeSlot(id, slotId, request);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/time-slots/{slotId}")
    public ResponseEntity<Void> deleteTimeSlot(
            @PathVariable Long id,
            @PathVariable Long slotId) {
        timeSlotService.deleteTimeSlot(id, slotId);
        return ResponseEntity.noContent().build();
    }

    // Employee Assignment Endpoints

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/employees")
    public ResponseEntity<List<ro.atm.backend.domain.activity.dto.AssignedEmployeeDTO>> getAssignedEmployees(@PathVariable Long id) {
        return ResponseEntity.ok(activityEmployeeService.getAssignedEmployees(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/employees/{employeeId}")
    public ResponseEntity<ro.atm.backend.domain.activity.dto.AssignedEmployeeDTO> assignEmployee(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(activityEmployeeService.assignEmployee(id, employeeId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/employees/{employeeId}")
    public ResponseEntity<Void> removeEmployee(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        activityEmployeeService.removeEmployee(id, employeeId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/employee-selection-enabled")
    public ResponseEntity<Void> updateEmployeeSelectionEnabled(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> request) {
        activityEmployeeService.updateEmployeeSelectionEnabled(id, request.get("enabled"));
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/employees/bulk")
    public ResponseEntity<List<ro.atm.backend.domain.activity.dto.AssignedEmployeeDTO>> assignEmployees(
            @PathVariable Long id,
            @RequestBody List<Long> employeeIds) {
        return ResponseEntity.ok(activityEmployeeService.assignEmployees(id, employeeIds));
    }
}