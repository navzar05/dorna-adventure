package ro.atm.backend.domain.employee.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.atm.backend.domain.employee.entity.EmployeeWorkHour;
import ro.atm.backend.domain.auth.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeWorkHourRepository extends JpaRepository<EmployeeWorkHour, Long> {

    // Get all work hours for an employee from a specific date onwards (current and future)
    @Query("SELECT e FROM EmployeeWorkHour e WHERE e.employee = :employee AND e.workDate >= :fromDate ORDER BY e.workDate, e.startTime")
    List<EmployeeWorkHour> findByEmployeeFromDate(@Param("employee") User employee, @Param("fromDate") LocalDate fromDate);

    // Get work hours for an employee within a date range
    @Query("SELECT e FROM EmployeeWorkHour e WHERE e.employee = :employee AND e.workDate BETWEEN :startDate AND :endDate ORDER BY e.workDate, e.startTime")
    List<EmployeeWorkHour> findByEmployeeAndWorkDateBetweenOrderByWorkDate(
            @Param("employee") User employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<EmployeeWorkHour> findByWorkDate(LocalDate workDate);

    // Get all work hours for a specific date (returns list - can be multiple intervals)
    @Query("SELECT e FROM EmployeeWorkHour e WHERE e.employee = :employee AND e.workDate = :workDate ORDER BY e.startTime")
    List<EmployeeWorkHour> findByEmployeeAndWorkDate(@Param("employee") User employee, @Param("workDate") LocalDate workDate);

    @Query("SELECT e FROM EmployeeWorkHour e WHERE e.workDate BETWEEN :startDate AND :endDate")
    List<EmployeeWorkHour> findEmployeeWorkHoursInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Delete all work hours for an employee on a specific date
    void deleteByEmployeeAndWorkDate(User employee, LocalDate workDate);

    // Check if any work hours exist for employee on a date
    boolean existsByEmployeeAndWorkDate(User employee, LocalDate workDate);
}