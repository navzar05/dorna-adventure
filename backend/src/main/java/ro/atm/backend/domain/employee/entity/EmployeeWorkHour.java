package ro.atm.backend.domain.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import ro.atm.backend.domain.auth.entity.User;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "employee_work_hours",
        indexes = {
                @Index(name = "idx_employee_work_hours_employee", columnList = "employee_id"),
                @Index(name = "idx_employee_work_hours_date", columnList = "work_date"),
                @Index(name = "idx_employee_work_hours_employee_date", columnList = "employee_id, work_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class EmployeeWorkHour {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;
}