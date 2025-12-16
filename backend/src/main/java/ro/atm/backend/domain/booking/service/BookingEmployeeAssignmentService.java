package ro.atm.backend.domain.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityCategory;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service responsible for employee assignment and availability checking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEmployeeAssignmentService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    /**
     * Find an available employee for a booking
     */
    public User findAvailableEmployee(LocalDate date, LocalTime startTime, LocalTime endTime,
                                     Activity activity, int numberOfParticipants) {
        var employeeRole = roleRepository.findByName(SecurityConstants.Roles.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.EMPLOYEE));

        List<User> employees = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(employeeRole) && user.isEnabled())
                .collect(Collectors.toList());

        for (User employee : employees) {
            if (canEmployeeHandleBooking(employee, date, startTime, endTime, activity, numberOfParticipants, null)) {
                return employee;
            }
        }

        return null;
    }

    /**
     * Check if an employee can handle a booking at a specific time
     * Supports multiple overlapping bookings if they share same category, location, and don't exceed capacity
     */
    public boolean canEmployeeHandleBooking(User employee, LocalDate date,
                                           LocalTime startTime, LocalTime endTime,
                                           Activity newActivity, int newParticipants,
                                           Long excludeBookingId) {

        List<Booking> employeeBookings = bookingRepository.findByEmployeeAndDate(employee.getId(), date);

        // Get overlapping bookings (excluding cancelled ones and the excluded booking)
        List<Booking> overlappingBookings = employeeBookings.stream()
                .filter(b -> excludeBookingId == null || !b.getId().equals(excludeBookingId))
                .filter(b -> b.getStatus() != Booking.BookingStatus.CANCELLED)
                .filter(b -> timesOverlap(startTime, endTime, b.getStartTime(), b.getEndTime()))
                .collect(Collectors.toList());

        // If no overlapping bookings, employee is completely free
        if (overlappingBookings.isEmpty()) {
            log.debug("Employee {} is free at {}-{}", employee.getUsername(), startTime, endTime);
            return true;
        }

        // Check if all overlapping bookings are compatible
        ActivityCategory newCategory = newActivity.getCategory();
        if (newCategory == null) {
            log.warn("Activity {} has no category, cannot allow shared bookings", newActivity.getName());
            return false;
        }

        // All overlapping bookings must have same category
        boolean allSameCategory = overlappingBookings.stream()
                .allMatch(b -> b.getActivity().getCategory() != null &&
                        b.getActivity().getCategory().getId().equals(newCategory.getId()));

        if (!allSameCategory) {
            log.debug("Employee {} has bookings in different categories", employee.getUsername());
            return false;
        }

        // All overlapping bookings must have same location
        boolean allSameLocation = overlappingBookings.stream()
                .allMatch(b -> newActivity.hasSameLocationAs(b.getActivity()));

        if (!allSameLocation) {
            log.debug("Employee {} has bookings at different locations", employee.getUsername());
            return false;
        }

        // Calculate total participants
        int currentParticipants = overlappingBookings.stream()
                .mapToInt(Booking::getNumberOfParticipants)
                .sum();

        int totalParticipants = currentParticipants + newParticipants;
        Integer maxParticipants = newCategory.getMaxParticipantsPerGuide();

        log.debug("Employee {}: category={}, location={}, current={}, new={}, total={}, max={}",
                employee.getUsername(), newCategory.getName(), newActivity.getLocationIdentifier(),
                currentParticipants, newParticipants, totalParticipants, maxParticipants);

        if (totalParticipants > maxParticipants) {
            log.debug("Employee {} would exceed capacity: {} > {}",
                    employee.getUsername(), totalParticipants, maxParticipants);
            return false;
        }

        log.info("Employee {} can handle multiple activities: {} participants across {} bookings at {} ({})",
                employee.getUsername(), totalParticipants, overlappingBookings.size() + 1,
                newActivity.getLocationIdentifier(), newCategory.getName());

        return true;
    }

    /**
     * Check if two time ranges overlap
     */
    private boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
