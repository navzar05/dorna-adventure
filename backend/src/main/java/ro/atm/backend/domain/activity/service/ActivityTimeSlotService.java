package ro.atm.backend.domain.activity.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.common.exception.ResourceNotFoundException;
import ro.atm.backend.domain.activity.dto.ActivityTimeSlotDTO;
import ro.atm.backend.domain.activity.dto.ActivityTimeSlotRequest;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityTimeSlot;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.activity.repository.ActivityTimeSlotRepository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityTimeSlotService {

    private final ActivityTimeSlotRepository timeSlotRepository;
    private final ActivityRepository activityRepository;

    /**
     * Get all time slots for an activity
     */
    public List<ActivityTimeSlotDTO> getActivityTimeSlots(Long activityId) {
        return timeSlotRepository.findByActivityId(activityId).stream()
                .map(ActivityTimeSlotDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create a new time slot for an activity
     */
    @Transactional
    public ActivityTimeSlotDTO createTimeSlot(Long activityId, ActivityTimeSlotRequest request) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", activityId));

        // Validate time slot
        validateTimeSlot(request);

        ActivityTimeSlot timeSlot = request.toEntity(activity);
        activity.addTimeSlot(timeSlot);

        ActivityTimeSlot saved = timeSlotRepository.save(timeSlot);
        log.info("Created time slot {} for activity {}", saved.getId(), activityId);

        return ActivityTimeSlotDTO.fromEntity(saved);
    }

    /**
     * Update an existing time slot
     */
    @Transactional
    public ActivityTimeSlotDTO updateTimeSlot(Long activityId, Long timeSlotId, ActivityTimeSlotRequest request) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", activityId));

        ActivityTimeSlot timeSlot = timeSlotRepository.findById(timeSlotId)
                .orElseThrow(() -> new ResourceNotFoundException("ActivityTimeSlot", timeSlotId));

        // Verify the time slot belongs to the activity
        if (!timeSlot.getActivity().getId().equals(activityId)) {
            throw new IllegalArgumentException("Time slot does not belong to the specified activity");
        }

        // Validate time slot
        validateTimeSlot(request);

        request.updateEntity(timeSlot);
        ActivityTimeSlot updated = timeSlotRepository.save(timeSlot);

        log.info("Updated time slot {} for activity {}", timeSlotId, activityId);

        return ActivityTimeSlotDTO.fromEntity(updated);
    }

    /**
     * Delete a time slot
     */
    @Transactional
    public void deleteTimeSlot(Long activityId, Long timeSlotId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", activityId));

        ActivityTimeSlot timeSlot = timeSlotRepository.findById(timeSlotId)
                .orElseThrow(() -> new ResourceNotFoundException("ActivityTimeSlot", timeSlotId));

        // Verify the time slot belongs to the activity
        if (!timeSlot.getActivity().getId().equals(activityId)) {
            throw new IllegalArgumentException("Time slot does not belong to the specified activity");
        }

        activity.removeTimeSlot(timeSlot);
        timeSlotRepository.delete(timeSlot);

        log.info("Deleted time slot {} for activity {}", timeSlotId, activityId);
    }

    /**
     * Check if a booking time is valid for an activity
     * Returns true if:
     * - Activity has no time slots defined (backward compatibility), OR
     * - The booking's start time exactly matches a time slot's start time AND
     *   the booking's end time is before or equal to that time slot's end time
     */
    public boolean isBookingTimeValid(Long activityId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        List<ActivityTimeSlot> timeSlots = timeSlotRepository.findByActivityIdAndActiveTrue(activityId);

        // If no time slots are defined, allow any time (backward compatibility)
        if (timeSlots.isEmpty()) {
            return true;
        }

        // Check if the booking start time matches any time slot's start time
        // and the booking end time is before or equal to that time slot's end time
        return timeSlots.stream()
                .anyMatch(slot -> slot.getStartTime().equals(startTime) &&
                                 !endTime.isAfter(slot.getEndTime()));
    }

    /**
     * Validate time slot constraints
     */
    private void validateTimeSlot(ActivityTimeSlotRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) ||
            request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }
}
