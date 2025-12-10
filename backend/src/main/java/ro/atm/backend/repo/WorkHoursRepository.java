package ro.atm.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.atm.backend.entity.WorkHours;

import java.time.DayOfWeek;
import java.util.Optional;

@Repository
public interface WorkHoursRepository extends JpaRepository<WorkHours, Long> {
    Optional<WorkHours> findByDayOfWeek(DayOfWeek dayOfWeek);
}