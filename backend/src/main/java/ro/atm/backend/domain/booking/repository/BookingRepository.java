package ro.atm.backend.domain.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.booking.entity.Booking;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByActivityId(Long activityId);

    @Query("SELECT b FROM Booking b WHERE b.bookingDate = :date AND b.status != 'CANCELLED'")
    List<Booking> findByDate(@Param("date") LocalDate date);

    @Query("SELECT b FROM Booking b WHERE b.employee.id = :employeeId AND b.bookingDate = :date AND b.status != 'CANCELLED'")
    List<Booking> findByEmployeeAndDate(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);

    List<Booking> findByBookingDateBetweenAndStatusNot(
            LocalDate startDate,
            LocalDate endDate,
            Booking.BookingStatus status
    );

    @Query("SELECT b FROM Booking b WHERE b.activity.id = :activityId AND b.bookingDate = :date AND b.status != 'CANCELLED'")
    List<Booking> findByActivityAndDate(@Param("activityId") Long activityId, @Param("date") LocalDate date);
}