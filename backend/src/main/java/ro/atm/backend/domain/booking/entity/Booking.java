package ro.atm.backend.domain.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.activity.entity.Activity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    public enum BookingStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED
    }

    public enum PaymentStatus {
        UNPAID,
        DEPOSIT_PAID,
        FULLY_PAID,
        PARTIALLY_REFUNDED,
        FULLY_REFUNDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 100)
    private String guestName;

    @Column(length = 20)
    private String guestPhone;

    @Column(length = 100)
    private String guestEmail;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private User employee;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Integer numberOfParticipants;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private BigDecimal depositPaid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(length = 1000)
    private String notes;

    // Payment fields
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(nullable = false)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean willPayRemainingCash = false;

    @Column
    private LocalDateTime confirmedAt;

    @Column
    private LocalDateTime paymentDeadline;

    // Automatically calculate remaining amount before persisting
    @PrePersist
    @PreUpdate
    public void calculateRemainingAmount() {
        if (this.paidAmount == null) {
            this.paidAmount = BigDecimal.ZERO;
        }
        if (this.totalPrice != null) {
            this.remainingAmount = this.totalPrice.subtract(this.paidAmount);
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.UNPAID;
        }
        if (this.willPayRemainingCash == null) {
            this.willPayRemainingCash = false;
        }
    }

    public String getCustomerName() {
        if (user != null) {
            return user.getFirstName() + " " + user.getLastName();
        }
        return guestName;
    }

    public String getCustomerContact() {
        if (user != null) {
            return user.getEmail();
        }
        return guestEmail != null ? guestEmail : guestPhone;
    }

    public boolean isGuestBooking() {
        return user == null;
    }
}