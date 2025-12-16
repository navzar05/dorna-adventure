package ro.atm.backend.domain.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.booking.dto.TimeSlotDTO;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.employee.entity.EmployeeWorkHour;
import ro.atm.backend.domain.employee.repository.EmployeeWorkHourRepository;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service responsible for booking scheduling and time slot management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingSchedulingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BookingEmployeeAssignmentService employeeAssignmentService;
    private final EmployeeWorkHourRepository employeeWorkHourRepository;

    /**
     * Get available time slots for an activity on a specific date
     */
    public Set<TimeSlotDTO> getAvailableTimeSlots(Long activityId, LocalDate date,
                                                    Integer numberOfParticipants, Activity activity) {
        List<EmployeeWorkHour> workHours = employeeWorkHourRepository.findByWorkDate(date);

        if (workHours == null) {
            return Set.of();
        }

        List<Booking> bookings = bookingRepository.findByActivityAndDate(activityId, date);

        // Get all enabled employees with ROLE_EMPLOYEE
        var employeeRole = roleRepository.findByName(SecurityConstants.Roles.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.EMPLOYEE));
        List<User> employees = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(employeeRole) && user.isEnabled())
                .collect(Collectors.toList());

        if (employees.isEmpty()) {
            return Set.of();
        }

        // Use provided participants or default to minimum
        int participantCount = (numberOfParticipants != null && numberOfParticipants > 0)
                ? numberOfParticipants
                : activity.getMinParticipants();

        Set<TimeSlotDTO> slots = new HashSet<>();
        int durationMinutes = activity.getDurationMinutes();

        // adding additional loop for more work hour intervals
        for (EmployeeWorkHour workHour : workHours) {

            LocalTime currentTime = workHour.getStartTime();

            while (currentTime.plusMinutes(durationMinutes).isBefore(workHour.getEndTime()) ||
                    currentTime.plusMinutes(durationMinutes).equals(workHour.getEndTime())) {

                LocalTime endTime = currentTime.plusMinutes(durationMinutes);

                boolean isAvailable = isTimeSlotAvailableForParticipants(
                        currentTime, endTime, date, employees, activity, participantCount);

                slots.add(TimeSlotDTO.builder()
                        .startTime(currentTime)
                        .endTime(endTime)
                        .available(isAvailable)
                        .build());

                currentTime = currentTime.plusMinutes(30);
            }
        }
        return slots;
    }

    /**
     * Check if a time slot is available for a specific number of participants
     */
    public boolean isTimeSlotAvailableForParticipants(LocalTime startTime, LocalTime endTime,
                                                      LocalDate date, List<User> employees,
                                                      Activity activity, int numberOfParticipants) {
        for (User employee : employees) {
            if (employeeAssignmentService.canEmployeeHandleBooking(employee, date, startTime, endTime,
                    activity, numberOfParticipants, null)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a time slot is available (using activity's minimum participants)
     */
    public boolean isTimeSlotAvailable(LocalTime startTime, LocalTime endTime, LocalDate date,
                                      List<User> employees, Activity activity) {
        for (User employee : employees) {
            if (employeeAssignmentService.canEmployeeHandleBooking(employee, date, startTime, endTime,
                    activity, activity.getMinParticipants(), null)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if two time ranges overlap
     */
    public boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
