package ro.atm.backend.domain.activity.entity;

import jakarta.persistence.*;
import lombok.*;
import ro.atm.backend.domain.auth.entity.User;

/**
 * Join entity representing which employees can be assigned to which activities
 */
@Entity
@Table(name = "activity_employee",
        uniqueConstraints = @UniqueConstraint(columnNames = {"activity_id", "employee_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEmployee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false)
    private Boolean active = true;
}
