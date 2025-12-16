package ro.atm.backend.domain.employee.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.booking.dto.CompatibleBookingDTO;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.booking.service.BookingEmployeeAssignmentService;
import ro.atm.backend.domain.booking.service.BookingSchedulingService;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.employee.dto.EmployeeSwapInfo;
import ro.atm.backend.domain.employee.dto.EmployeeSwapOptions;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service responsible for employee scheduling and swap operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeSchedulingService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingEmployeeAssignmentService employeeAssignmentService;
    private final BookingSchedulingService schedulingService;

    /**
     * Checks if employee reassignment requires a swap and provides swap information
     */
    public EmployeeSwapInfo checkEmployeeSwap(Long bookingId, Long newEmployeeId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User newEmployee = userRepository.findById(newEmployeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get new employee's bookings on the same date
        List<Booking> employeeBookings = bookingRepository.findByEmployeeAndDate(
                newEmployeeId, booking.getBookingDate());

        // Find conflicting booking
        Booking conflictingBooking = employeeBookings.stream()
                .filter(b -> !b.getId().equals(bookingId))
                .filter(b -> b.getStatus() != Booking.BookingStatus.CANCELLED)
                .filter(b -> schedulingService.timesOverlap(
                        booking.getStartTime(), booking.getEndTime(),
                        b.getStartTime(), b.getEndTime()))
                .findFirst()
                .orElse(null);

        // If no conflict, swap not needed
        if (conflictingBooking == null) {
            return EmployeeSwapInfo.builder()
                    .canSwap(false)
                    .reason("No conflict - direct assignment possible")
                    .build();
        }

        // Check if activities are compatible for swap
        Activity activity1 = booking.getActivity();
        Activity activity2 = conflictingBooking.getActivity();

        boolean sameCategory = activity1.getCategory() != null &&
                activity2.getCategory() != null &&
                activity1.getCategory().getId().equals(activity2.getCategory().getId());

        boolean sameLocation = activity1.hasSameLocationAs(activity2);

        if (!sameCategory || !sameLocation) {
            return EmployeeSwapInfo.builder()
                    .conflictingBookingId(conflictingBooking.getId())
                    .conflictingBookingActivity(activity2.getName())
                    .currentEmployeeName(booking.getEmployee().getFirstName() + " " + booking.getEmployee().getLastName())
                    .newEmployeeName(newEmployee.getFirstName() + " " + newEmployee.getLastName())
                    .location(activity1.getLocation())
                    .category(activity1.getCategory() != null ? activity1.getCategory().getName() : "N/A")
                    .startTime(booking.getStartTime().toString())
                    .endTime(booking.getEndTime().toString())
                    .canSwap(false)
                    .reason("Activities not compatible - different category or location")
                    .build();
        }

        boolean currentEmployeeCanHandle = employeeAssignmentService.canEmployeeHandleBooking(
                booking.getEmployee(),
                conflictingBooking.getBookingDate(),
                conflictingBooking.getStartTime(),
                conflictingBooking.getEndTime(),
                conflictingBooking.getActivity(),
                conflictingBooking.getNumberOfParticipants(),
                conflictingBooking.getId()
        );

        if (!currentEmployeeCanHandle) {
            return EmployeeSwapInfo.builder()
                    .conflictingBookingId(conflictingBooking.getId())
                    .conflictingBookingActivity(activity2.getName())
                    .currentEmployeeName(booking.getEmployee().getFirstName() + " " + booking.getEmployee().getLastName())
                    .newEmployeeName(newEmployee.getFirstName() + " " + newEmployee.getLastName())
                    .location(activity1.getLocation())
                    .category(activity1.getCategory().getName())
                    .startTime(booking.getStartTime().toString())
                    .endTime(booking.getEndTime().toString())
                    .canSwap(false)
                    .reason("Current employee cannot handle the conflicting booking due to capacity")
                    .build();
        }

        // Swap is possible
        return EmployeeSwapInfo.builder()
                .conflictingBookingId(conflictingBooking.getId())
                .conflictingBookingActivity(activity2.getName())
                .currentEmployeeName(booking.getEmployee().getFirstName() + " " + booking.getEmployee().getLastName())
                .newEmployeeName(newEmployee.getFirstName() + " " + newEmployee.getLastName())
                .location(activity1.getLocation())
                .category(activity1.getCategory().getName())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime().toString())
                .canSwap(true)
                .build();
    }

    /**
     * Swaps employees between two bookings
     */
    @Transactional
    public void swapEmployees(Long booking1Id, Long booking2Id) {
        Booking booking1 = bookingRepository.findById(booking1Id)
                .orElseThrow(() -> new RuntimeException("Booking 1 not found"));

        Booking booking2 = bookingRepository.findById(booking2Id)
                .orElseThrow(() -> new RuntimeException("Booking 2 not found"));

        // Verify bookings are compatible
        if (!booking1.getActivity().hasSameLocationAs(booking2.getActivity())) {
            throw new RuntimeException("Bookings are at different locations");
        }

        if (!booking1.getActivity().getCategory().getId().equals(booking2.getActivity().getCategory().getId())) {
            throw new RuntimeException("Bookings are in different categories");
        }

        // Swap employees
        User temp = booking1.getEmployee();
        booking1.setEmployee(booking2.getEmployee());
        booking2.setEmployee(temp);

        bookingRepository.save(booking1);
        bookingRepository.save(booking2);

        log.info("Swapped employees between bookings {} and {}", booking1Id, booking2Id);
    }

    /**
     * Gets available swap options for employee reassignment
     */
    public EmployeeSwapOptions getEmployeeSwapOptions(Long bookingId, Long newEmployeeId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User currentEmployee = booking.getEmployee();
        User newEmployee = userRepository.findById(newEmployeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Activity bookingActivity = booking.getActivity();

        List<Booking> employeeBookings = bookingRepository.findByEmployeeAndDate(
                newEmployeeId, booking.getBookingDate());

        List<Booking> overlappingBookings = employeeBookings.stream()
                .filter(b -> !b.getId().equals(bookingId))
                .filter(b -> b.getStatus() != Booking.BookingStatus.CANCELLED)
                .filter(b -> schedulingService.timesOverlap(
                        booking.getStartTime(), booking.getEndTime(),
                        b.getStartTime(), b.getEndTime()))
                .collect(Collectors.toList());

        if (overlappingBookings.isEmpty()) {
            return EmployeeSwapOptions.builder()
                    .hasCompatibleBookings(false)
                    .reason("No conflicting bookings - direct assignment possible")
                    .build();
        }

        List<CompatibleBookingDTO> compatibleBookings = overlappingBookings.stream()
                .filter(b -> {
                    Activity otherActivity = b.getActivity();

                    boolean sameCategory = bookingActivity.getCategory() != null &&
                            otherActivity.getCategory() != null &&
                            bookingActivity.getCategory().getId().equals(otherActivity.getCategory().getId());
                    boolean sameLocation = bookingActivity.hasSameLocationAs(otherActivity);

                    if (!sameCategory || !sameLocation) {
                        log.debug("Booking {} incompatible: category match={}, location match={}",
                                b.getId(), sameCategory, sameLocation);
                        return false;
                    }

                    // CHECK 1: Can current employee handle the candidate booking (b)?
                    // Exclude the original booking because they're dropping it
                    boolean currentEmployeeCanHandleSwap = employeeAssignmentService.canEmployeeHandleBooking(
                            currentEmployee,
                            b.getBookingDate(),
                            b.getStartTime(),
                            b.getEndTime(),
                            b.getActivity(),
                            b.getNumberOfParticipants(),
                            booking.getId()  // Exclude original booking they're giving up
                    );

                    // CHECK 2: Can new employee handle the original booking?
                    // Exclude the candidate booking because they're dropping it
                    boolean newEmployeeCanHandleSwap = employeeAssignmentService.canEmployeeHandleBooking(
                            newEmployee,
                            booking.getBookingDate(),
                            booking.getStartTime(),
                            booking.getEndTime(),
                            booking.getActivity(),
                            booking.getNumberOfParticipants(),
                            b.getId()  // Exclude candidate booking they're giving up
                    );

                    if (!currentEmployeeCanHandleSwap) {
                        log.debug("Current employee {} cannot handle booking {} ({} participants) - would exceed capacity after dropping booking {} ({} participants)",
                                currentEmployee.getUsername(), b.getId(), b.getNumberOfParticipants(),
                                booking.getId(), booking.getNumberOfParticipants());
                    }

                    if (!newEmployeeCanHandleSwap) {
                        log.debug("New employee {} cannot handle booking {} ({} participants) - would exceed capacity after dropping booking {} ({} participants)",
                                newEmployee.getUsername(), booking.getId(), booking.getNumberOfParticipants(),
                                b.getId(), b.getNumberOfParticipants());
                    }

                    // Both employees must be able to handle their new assignments
                    return currentEmployeeCanHandleSwap && newEmployeeCanHandleSwap;
                })
                .map(b -> {
                    String customerName;
                    if (b.getUser() != null) {
                        customerName = b.getUser().getFirstName() + " " + b.getUser().getLastName();
                    } else {
                        customerName = b.getGuestName();
                    }

                    return CompatibleBookingDTO.builder()
                            .bookingId(b.getId())
                            .activityName(b.getActivity().getName())
                            .customerName(customerName)
                            .isGuestBooking(b.isGuestBooking())
                            .numberOfParticipants(b.getNumberOfParticipants())
                            .startTime(b.getStartTime().toString())
                            .endTime(b.getEndTime().toString())
                            .date(b.getBookingDate().toString())
                            .build();
                })
                .collect(Collectors.toList());

        if (compatibleBookings.isEmpty()) {
            return EmployeeSwapOptions.builder()
                    .currentEmployeeName(currentEmployee.getFirstName() + " " + currentEmployee.getLastName())
                    .newEmployeeName(newEmployee.getFirstName() + " " + newEmployee.getLastName())
                    .location(bookingActivity.getLocation())
                    .category(bookingActivity.getCategory() != null ? bookingActivity.getCategory().getName() : "N/A")
                    .startTime(booking.getStartTime().toString())
                    .endTime(booking.getEndTime().toString())
                    .hasCompatibleBookings(false)
                    .compatibleBookings(List.of())
                    .reason("No compatible bookings found - different categories, locations, or capacity would be exceeded in one or both directions")
                    .build();
        }

        log.info("Found {} compatible bookings for swap. Original booking: {} ({} participants), Employee swap: {} -> {}",
                compatibleBookings.size(), booking.getId(), booking.getNumberOfParticipants(),
                currentEmployee.getUsername(), newEmployee.getUsername());

        return EmployeeSwapOptions.builder()
                .currentEmployeeName(currentEmployee.getFirstName() + " " + currentEmployee.getLastName())
                .newEmployeeName(newEmployee.getFirstName() + " " + newEmployee.getLastName())
                .location(bookingActivity.getLocation())
                .category(bookingActivity.getCategory().getName())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime().toString())
                .hasCompatibleBookings(true)
                .compatibleBookings(compatibleBookings)
                .build();
    }
}
