package ro.atm.backend.domain.booking.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.booking.dto.BookingDTO;
import ro.atm.backend.domain.booking.dto.BookingRequest;
import ro.atm.backend.domain.booking.dto.GuestBookingRequest;
import ro.atm.backend.domain.booking.dto.TimeSlotDTO;
import ro.atm.backend.domain.booking.service.BookingService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping("/available-slots")
    public ResponseEntity<List<TimeSlotDTO>> getAvailableTimeSlots(
            @RequestParam Long activityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer numberOfParticipants) {

        List<TimeSlotDTO> slots = bookingService.getAvailableTimeSlots(activityId, date, numberOfParticipants);
        return ResponseEntity.ok(slots);
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(
            @RequestBody BookingRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(bookingService.createBooking(request, username));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingDTO>> getMyBookings(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(bookingService.getUserBookings(username));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, status));
    }

    @PutMapping("/{id}/employee")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> updateBookingEmployee(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        Long employeeId = request.get("employeeId");
        return ResponseEntity.ok(bookingService.updateBookingEmployee(id, employeeId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/guest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> createGuestBooking(@RequestBody GuestBookingRequest request) {
        return ResponseEntity.ok(bookingService.createGuestBooking(request));
    }

    @GetMapping("/{id}/can-pay")
    public ResponseEntity<Map<String, Object>> canAcceptPayment(@PathVariable Long id) {
        BookingDTO booking = bookingService.getBookingById(id);
        boolean canPay = bookingService.canAcceptPayment(id);

        Map<String, Object> response = new HashMap<>();
        response.put("canPay", canPay);
        response.put("status", booking.getStatus());
        response.put("paymentStatus", booking.getPaymentStatus());
        response.put("paymentDeadline", booking.getPaymentDeadline());
        response.put("confirmedAt", booking.getConfirmedAt());
        return ResponseEntity.ok(response);
    }
}