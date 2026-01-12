package ro.atm.backend.domain.activity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "activity_time_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Check if a booking is valid for this time slot.
     * The booking start time must exactly match this slot's start time,
     * and the booking end time must be before or equal to this slot's end time.
     */
    public boolean isValidBookingTime(LocalTime bookingStartTime, LocalTime bookingEndTime) {
        return this.startTime.equals(bookingStartTime) && !bookingEndTime.isAfter(this.endTime);
    }

    /**
     * Check if a given time range overlaps with this time slot
     */
    public boolean overlapsWithTimeRange(LocalTime checkStartTime, LocalTime checkEndTime) {
        return checkStartTime.isBefore(this.endTime) && checkEndTime.isAfter(this.startTime);
    }
}
