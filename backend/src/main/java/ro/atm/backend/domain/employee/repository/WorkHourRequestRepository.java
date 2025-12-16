package ro.atm.backend.domain.employee.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.employee.entity.WorkHourRequest;
import ro.atm.backend.domain.auth.entity.User;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkHourRequestRepository extends JpaRepository<WorkHourRequest, Long> {

    List<WorkHourRequest> findByEmployeeOrderByRequestedAtDesc(User employee);

    List<WorkHourRequest> findByStatusOrderByRequestedAtDesc(WorkHourRequest.RequestStatus status);

    List<WorkHourRequest> findAllByOrderByRequestedAtDesc();

    List<WorkHourRequest> findByEmployeeAndStatus(User employee, WorkHourRequest.RequestStatus status);

    List<WorkHourRequest> findByEmployeeAndWorkDateBetweenOrderByWorkDate(User employee, LocalDate startDate, LocalDate endDate);

    List<WorkHourRequest> findByWorkDateBetweenOrderByWorkDate(LocalDate startDate, LocalDate endDate);
}