package ro.atm.backend.domain.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.activity.entity.ActivityTimeSlot;

import java.util.List;

@Repository
public interface ActivityTimeSlotRepository extends JpaRepository<ActivityTimeSlot, Long> {

    /**
     * Find all time slots for a specific activity
     */
    List<ActivityTimeSlot> findByActivityId(Long activityId);

    /**
     * Find active time slots for a specific activity
     */
    List<ActivityTimeSlot> findByActivityIdAndActiveTrue(Long activityId);

    /**
     * Delete all time slots for a specific activity
     */
    void deleteByActivityId(Long activityId);

    /**
     * Check if an activity has any time slots defined
     */
    @Query("SELECT COUNT(t) > 0 FROM ActivityTimeSlot t WHERE t.activity.id = :activityId")
    boolean existsByActivityId(@Param("activityId") Long activityId);
}
