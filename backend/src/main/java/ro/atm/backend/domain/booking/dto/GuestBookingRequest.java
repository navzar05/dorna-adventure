package ro.atm.backend.domain.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GuestBookingRequest {
    private Long activityId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private Integer numberOfParticipants;
    private String notes;

    // Guest info
    private String guestName;
    private String guestPhone;
    private String guestEmail;
}