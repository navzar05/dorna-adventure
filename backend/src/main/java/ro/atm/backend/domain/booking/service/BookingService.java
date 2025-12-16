package ro.atm.backend.domain.booking.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.auth.entity.Role;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.booking.dto.BookingDTO;
import ro.atm.backend.domain.booking.dto.BookingRequest;
import ro.atm.backend.domain.booking.dto.GuestBookingRequest;
import ro.atm.backend.domain.booking.dto.TimeSlotDTO;
import ro.atm.backend.domain.booking.entity.Booking;
import ro.atm.backend.domain.booking.repository.BookingRepository;
import ro.atm.backend.domain.employee.entity.EmployeeWorkHour;
import ro.atm.backend.domain.employee.repository.EmployeeWorkHourRepository;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;
import ro.atm.backend.common.exception.ValidationException;
import ro.atm.backend.infrastructure.sms.SmsService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Main orchestration service for booking operations
 * Delegates to specialized services for scheduling, assignment, and validation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // Specialized services
    private final BookingSchedulingService schedulingService;
    private final BookingEmployeeAssignmentService employeeAssignmentService;
    private final BookingValidationService validationService;
    private final SmsService smsService;
    private final EmployeeWorkHourRepository employeeWorkHourRepository;

    /**
     * Get available time slots for an activity on a specific date
     */
    public List<TimeSlotDTO> getAvailableTimeSlots(Long activityId, LocalDate date, Integer numberOfParticipants) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        return schedulingService.getAvailableTimeSlots(activityId, date, numberOfParticipants, activity)
                .stream()
                .toList();
    }

    /**
     * Create a booking for an authenticated user
     */
    @Transactional
    public BookingDTO createBooking(BookingRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Validate participant count
        validationService.validateParticipantCount(activity, request.getNumberOfParticipants());

        // Calculate pricing
        BigDecimal totalPrice = activity.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getNumberOfParticipants()));
        BigDecimal depositAmount = totalPrice
                .multiply(activity.getDepositPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        LocalTime endTime = request.getStartTime().plusMinutes(activity.getDurationMinutes());

        // Find available employee
        User assignedEmployee = employeeAssignmentService.findAvailableEmployee(
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

    /**
     * Create a guest booking (no user account required)
     */
    @Transactional
    public BookingDTO createGuestBooking(GuestBookingRequest request) {
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Validate guest data
        validationService.validateGuestBookingData(request.getGuestName(), request.getGuestPhone());

        // Validate participant count
        validationService.validateParticipantCount(activity, request.getNumberOfParticipants());

        // Calculate pricing
        BigDecimal totalPrice = activity.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getNumberOfParticipants()));
        BigDecimal depositAmount = totalPrice
                .multiply(activity.getDepositPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        LocalTime endTime = request.getStartTime().plusMinutes(activity.getDurationMinutes());

        // Find available employee
        User assignedEmployee = employeeAssignmentService.findAvailableEmployee(
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

        // Send payment link SMS to guest
        if (saved.getGuestPhone() != null && !saved.getGuestPhone().isBlank()) {
            smsService.sendPaymentLink(
                saved.getGuestPhone(),
                saved.getId(),
                saved.getGuestName(),
                saved.getDepositPaid()
            );
        }

        return BookingDTO.fromEntity(saved);
    }

    /**
     * Update booking status
     */
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

        validationService.validateStatusTransition(booking.getStatus(), newStatus);

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

    /**
     * Update the employee assigned to a booking
     */
    @Transactional
    public BookingDTO updateBookingEmployee(Long bookingId, Long employeeId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        Role employeeRole = roleRepository.findByName(SecurityConstants.Roles.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.EMPLOYEE));

        if (!employee.getRoles().contains(employeeRole)) {
            throw new RuntimeException("User is not an employee");
        }

        // Check if employee can handle this booking
        if (!employeeAssignmentService.canEmployeeHandleBooking(employee, booking.getBookingDate(),
                booking.getStartTime(), booking.getEndTime(),
                booking.getActivity(), booking.getNumberOfParticipants(),
                booking.getId())) {
            throw new RuntimeException("Employee cannot handle this booking due to capacity limits");
        }

        booking.setEmployee(employee);
        Booking updated = bookingRepository.save(booking);
        return BookingDTO.fromEntity(updated);
    }

    /**
     * Get all bookings
     */
    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(BookingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get bookings for a specific user
     */
    public List<BookingDTO> getUserBookings(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return bookingRepository.findByUserId(user.getId()).stream()
                .map(BookingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a booking by ID
     */
    public BookingDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return BookingDTO.fromEntity(booking);
    }

    /**
     * Cancel a booking
     */
    @Transactional
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    /**
     * Check if a booking can accept payment
     */
    public boolean canAcceptPayment(Long bookingId) {
        return validationService.canAcceptPayment(bookingId);
    }

    /**
     * Automatically cancel expired bookings (runs hourly)
     */
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

    /**
     * Utility method: Check if two time ranges overlap
     */
    public boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return schedulingService.timesOverlap(start1, end1, start2, end2);
    }

    public List<String> getAvailableDatesForMonth(Long activityId, LocalDate date, int participants) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", activityId));

        YearMonth yearMonth = YearMonth.from(date);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        // 1. Fetch all Employees working this month
        // We assume this returns work hours for ALL employees capable of doing activities
        List<EmployeeWorkHour> allWorkHours = employeeWorkHourRepository.findEmployeeWorkHoursInDateRange(
                startOfMonth, endOfMonth
        );

        // 2. Fetch all ACTIVE bookings for this month (ignore CANCELLED)
        List<Booking> allBookings = bookingRepository.findByBookingDateBetweenAndStatusNot(
                startOfMonth, endOfMonth, Booking.BookingStatus.CANCELLED
        );

        // 3. Group data by Date for efficient lookup
        Map<LocalDate, List<EmployeeWorkHour>> workHoursByDate = allWorkHours.stream()
                .collect(Collectors.groupingBy(EmployeeWorkHour::getWorkDate));

        Map<LocalDate, List<Booking>> bookingsByDate = allBookings.stream()
                .collect(Collectors.groupingBy(Booking::getBookingDate));

        List<String> availableDates = new ArrayList<>();

        // 4. Iterate through every day of the month
        for (int day = 1; day <= yearMonth.lengthOfMonth(); day++) {
            LocalDate currentDate = yearMonth.atDay(day);

            // optimization: skip past days
            if (currentDate.isBefore(LocalDate.now())) {
                continue;
            }

            // If no one is working that day, skip
            if (!workHoursByDate.containsKey(currentDate)) {
                continue;
            }

            // Check if there is AT LEAST one slot available on this day
            if (isDayAvailable(currentDate, activity, participants,
                    workHoursByDate.get(currentDate),
                    bookingsByDate.getOrDefault(currentDate, Collections.emptyList()))) {
                availableDates.add(currentDate.toString());
            }
        }

        return availableDates;
    }

    /**
     * Helper: Checks if a specific day has enough capacity for the activity.
     */
    private boolean isDayAvailable(LocalDate date, Activity activity, int participants,
                                   List<EmployeeWorkHour> workHours, List<Booking> bookings) {

        long durationMinutes = activity.getDurationMinutes();

        // Iterate over every employee working today
        for (EmployeeWorkHour workHour : workHours) {
            User employee = workHour.getEmployee();

            // 1. Filter bookings for THIS specific employee
            List<Booking> employeeBookings = bookings.stream()
                    .filter(b -> b.getEmployee().getId().equals(employee.getId()))
                    .collect(Collectors.toList());

            // 2. Generate potential slots for this employee
            // We scan their work day in steps (e.g., every 30 mins)
            LocalTime scanTime = workHour.getStartTime();
            LocalTime workEndTime = workHour.getEndTime();

            while (scanTime.plusMinutes(durationMinutes).isBefore(workEndTime) ||
                    scanTime.plusMinutes(durationMinutes).equals(workEndTime)) {

                LocalTime slotEnd = scanTime.plusMinutes(durationMinutes);

                // 3. Check if this specific slot overlaps with any existing booking
                boolean isSlotFree = true;
                for (Booking booking : employeeBookings) {
                    if (timesOverlap(scanTime, slotEnd, booking.getStartTime(), booking.getEndTime())) {
                        isSlotFree = false;
                        break;
                    }
                }

                // 4. If we found ONE free slot, the Day is available! Return true immediately.
                if (isSlotFree) {
                    return true;
                }

                // Move to next 30-min block (or 15 min for finer granularity)
                scanTime = scanTime.plusMinutes(30);
            }
        }

        // If we checked all employees and found no gaps -> Day is full
        return false;
    }
}
