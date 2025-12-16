package ro.atm.backend.domain.booking.dto;

import lombok.*;
import ro.atm.backend.domain.booking.entity.Booking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingDTO {
    private Long id;
    private Long activityId;
    private String activityName;
    private Long userId;
    private String userName;
    private Long employeeId;
    private String employeeName;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer numberOfParticipants;
    private BigDecimal totalPrice;
    private BigDecimal depositPaid;
    private String status;
    private String notes;
    private String paymentStatus;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private Boolean willPayRemainingCash;
    private LocalDateTime confirmedAt;
    private LocalDateTime paymentDeadline;
    private Boolean canAcceptPayment;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private Boolean isGuestBooking;

    public static BookingDTO fromEntity(Booking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .activityId(booking.getActivity().getId())
                .activityName(booking.getActivity().getName())
                .userId(booking.getUser() != null ? booking.getUser().getId() : null)
                .userName(booking.getUser() != null
                        ? booking.getUser().getFirstName() + " " + booking.getUser().getLastName()
                        : null)
                .guestName(booking.getGuestName())
                .guestPhone(booking.getGuestPhone())
                .guestEmail(booking.getGuestEmail())
                .isGuestBooking(booking.isGuestBooking())
                .employeeId(booking.getEmployee() != null ? booking.getEmployee().getId() : null)
                .employeeName(booking.getEmployee() != null
                        ? booking.getEmployee().getFirstName() + " " + booking.getEmployee().getLastName()
                        : null)
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .numberOfParticipants(booking.getNumberOfParticipants())
                .totalPrice(booking.getTotalPrice())
                .depositPaid(booking.getDepositPaid())
                .status(booking.getStatus().name())
                .notes(booking.getNotes())
                .paymentStatus(booking.getPaymentStatus().name())
                .paidAmount(booking.getPaidAmount())
                .remainingAmount(booking.getRemainingAmount())
                .willPayRemainingCash(booking.getWillPayRemainingCash())
                .confirmedAt(booking.getConfirmedAt())
                .paymentDeadline(booking.getPaymentDeadline())
                .build();
    }
}