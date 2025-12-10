// src/main/java/ro/atm/backend/service/BookingService.java
package ro.atm.backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ro.atm.backend.dto.BookingDTO;
import ro.atm.backend.dto.BookingRequest;
import ro.atm.backend.dto.GuestBookingRequest;
import ro.atm.backend.dto.TimeSlotDTO;
import ro.atm.backend.entity.*;
import ro.atm.backend.repo.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final WorkHoursRepository workHoursRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public BookingDTO updateBookingStatus(Long bookingId, String statusString) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Booking.BookingStatus newStatus;
        try {
            newStatus = Booking.BookingStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusString);
        }

        booking.setStatus(newStatus);

        if (newStatus == Booking.BookingStatus.CONFIRMED && booking.getConfirmedAt() == null) {
            LocalDateTime now = LocalDateTime.now();
            booking.setConfirmedAt(now);
            booking.setPaymentDeadline(now.plusHours(24));

            log.info("Booking {} confirmed at {}. Payment deadline: {}",
                    bookingId, now, booking.getPaymentDeadline());
        }

        Booking savedBooking = bookingRepository.save(booking);
        return BookingDTO.fromEntity(savedBooking);
    }

    public BookingDTO updateBookingEmployee(Long bookingId, Long employeeId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));

        if (!employee.getRoles().contains(employeeRole)) {
            throw new RuntimeException("User is not an employee");
        }

        // Check if employee can handle this booking
        if (!canEmployeeHandleBooking(employee, booking.getBookingDate(),
                booking.getStartTime(), booking.getEndTime(),
                booking.getActivity(), booking.getNumberOfParticipants(),
                booking.getId())) {
            throw new RuntimeException("Employee cannot handle this booking due to capacity limits");
        }

        booking.setEmployee(employee);
        Booking updated = bookingRepository.save(booking);
        return BookingDTO.fromEntity(updated);
    }

    public boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(BookingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getUserBookings(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return bookingRepository.findByUserId(user.getId()).stream()
                .map(BookingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public BookingDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return BookingDTO.fromEntity(booking);
    }

    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    public List<TimeSlotDTO> getAvailableTimeSlots(Long activityId, LocalDate date, Integer numberOfParticipants) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        WorkHours workHours = workHoursRepository.findByDayOfWeek(date.getDayOfWeek())
                .orElse(null);

        if (workHours == null || !workHours.getActive()) {
            return List.of();
        }

        List<Booking> bookings = bookingRepository.findByActivityAndDate(activityId, date);

        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));
        List<User> employees = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(employeeRole) && user.isEnabled())
                .collect(Collectors.toList());

        if (employees.isEmpty()) {
            return List.of();
        }

        // Use provided participants or default to minimum
        int participantCount = (numberOfParticipants != null && numberOfParticipants > 0)
                ? numberOfParticipants
                : activity.getMinParticipants();

        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime currentTime = workHours.getStartTime();
        int durationMinutes = activity.getDurationMinutes();

        while (currentTime.plusMinutes(durationMinutes).isBefore(workHours.getEndTime()) ||
                currentTime.plusMinutes(durationMinutes).equals(workHours.getEndTime())) {

            LocalTime endTime = currentTime.plusMinutes(durationMinutes);

            // Check availability considering the requested number of participants
            boolean isAvailable = isTimeSlotAvailableForParticipants(
                    currentTime, endTime, date, employees, activity, participantCount);

            slots.add(TimeSlotDTO.builder()
                    .startTime(currentTime)
                    .endTime(endTime)
                    .available(isAvailable)
                    .build());

            currentTime = currentTime.plusMinutes(30);
        }

        return slots;
    }

    private boolean isTimeSlotAvailableForParticipants(LocalTime startTime, LocalTime endTime,
                                                       LocalDate date, List<User> employees,
                                                       Activity activity, int numberOfParticipants) {
        for (User employee : employees) {
            if (canEmployeeHandleBooking(employee, date, startTime, endTime,
                    activity, numberOfParticipants, null)) {
                return true;
            }
        }
        return false;
    }

    private boolean isTimeSlotAvailable(LocalTime startTime, LocalTime endTime, LocalDate date,
                                        List<User> employees, Activity activity) {
        for (User employee : employees) {
            if (canEmployeeHandleBooking(employee, date, startTime, endTime, activity, activity.getMinParticipants(), null)) {
                return true;
            }
        }
        return false;
    }

    public BookingDTO createBooking(BookingRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (request.getNumberOfParticipants() < activity.getMinParticipants() ||
                request.getNumberOfParticipants() > activity.getMaxParticipants()) {
            throw new RuntimeException("Invalid number of participants");
        }

        BigDecimal totalPrice = activity.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getNumberOfParticipants()));
        BigDecimal depositAmount = totalPrice
                .multiply(activity.getDepositPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        LocalTime endTime = request.getStartTime().plusMinutes(activity.getDurationMinutes());

        // Find available employee
        User assignedEmployee = findAvailableEmployee(
                request.getBookingDate(),
                request.getStartTime(),
                endTime,
                activity,
                request.getNumberOfParticipants()
        );

        if (assignedEmployee == null) {
            throw new RuntimeException("No employee available for this time slot");
        }

        Booking booking = Booking.builder()
                .activity(activity)
                .user(user)
                .employee(assignedEmployee)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(endTime)
                .numberOfParticipants(request.getNumberOfParticipants())
                .totalPrice(totalPrice)
                .depositPaid(depositAmount)
                .status(Booking.BookingStatus.PENDING)
                .notes(request.getNotes())
                .paymentStatus(Booking.PaymentStatus.UNPAID)
                .paidAmount(BigDecimal.ZERO)
                .remainingAmount(totalPrice)
                .willPayRemainingCash(false)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: id={}, employee={}, activity={}, participants={}, location={}",
                saved.getId(), assignedEmployee.getUsername(), activity.getName(),
                request.getNumberOfParticipants(), activity.getLocationIdentifier());

        return BookingDTO.fromEntity(saved);
    }

    @Transactional
    public BookingDTO createGuestBooking(GuestBookingRequest request) {
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (request.getGuestName() == null || request.getGuestName().trim().isEmpty()) {
            throw new RuntimeException("Guest name is required");
        }
        if (request.getGuestPhone() == null || request.getGuestPhone().trim().isEmpty()) {
            throw new RuntimeException("Guest phone is required");
        }

        if (request.getNumberOfParticipants() < activity.getMinParticipants() ||
                request.getNumberOfParticipants() > activity.getMaxParticipants()) {
            throw new RuntimeException("Invalid number of participants");
        }

        BigDecimal totalPrice = activity.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getNumberOfParticipants()));
        BigDecimal depositAmount = totalPrice
                .multiply(activity.getDepositPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        LocalTime endTime = request.getStartTime().plusMinutes(activity.getDurationMinutes());

        User assignedEmployee = findAvailableEmployee(
                request.getBookingDate(),
                request.getStartTime(),
                endTime,
                activity,
                request.getNumberOfParticipants()
        );

        if (assignedEmployee == null) {
            throw new RuntimeException("No employee available for this time slot");
        }

        Booking booking = Booking.builder()
                .activity(activity)
                .user(null)
                .guestName(request.getGuestName())
                .guestPhone(request.getGuestPhone())
                .guestEmail(request.getGuestEmail())
                .employee(assignedEmployee)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(endTime)
                .numberOfParticipants(request.getNumberOfParticipants())
                .totalPrice(totalPrice)
                .depositPaid(depositAmount)
                .status(Booking.BookingStatus.PENDING)
                .notes(request.getNotes())
                .paymentStatus(Booking.PaymentStatus.UNPAID)
                .paidAmount(BigDecimal.ZERO)
                .remainingAmount(totalPrice)
                .willPayRemainingCash(false)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Guest booking created: id={}, guest={}, employee={}, activity={}, participants={}",
                saved.getId(), request.getGuestName(), assignedEmployee.getUsername(),
                activity.getName(), request.getNumberOfParticipants());

        return BookingDTO.fromEntity(saved);
    }

    private User findAvailableEmployee(LocalDate date, LocalTime startTime, LocalTime endTime,
                                       Activity activity, int numberOfParticipants) {
        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));

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

    public boolean canAcceptPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            return false;
        }

        if (booking.getPaymentDeadline() != null &&
                LocalDateTime.now().isAfter(booking.getPaymentDeadline())) {
            return false;
        }

        return booking.getPaymentStatus() != Booking.PaymentStatus.FULLY_PAID;
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void cancelExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();

        List<Booking> expiredBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                .filter(b -> b.getPaymentStatus() == Booking.PaymentStatus.UNPAID)
                .filter(b -> b.getPaymentDeadline() != null)
                .filter(b -> now.isAfter(b.getPaymentDeadline()))
                .collect(Collectors.toList());

        for (Booking booking : expiredBookings) {
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }

        if (!expiredBookings.isEmpty()) {
            log.info("Auto-cancelled {} expired bookings", expiredBookings.size());
        }
    }
}