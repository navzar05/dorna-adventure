package ro.atm.backend.domain.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompatibleBookingDTO {
    private Long bookingId;
    private String activityName;
    private String customerName;  // User or guest name
    private boolean isGuestBooking;
    private Integer numberOfParticipants;
    private String startTime;
    private String endTime;
    private String date;
}