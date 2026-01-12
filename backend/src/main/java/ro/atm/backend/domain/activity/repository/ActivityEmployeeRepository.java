package ro.atm.backend.domain.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.activity.entity.ActivityEmployee;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.auth.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityEmployeeRepository extends JpaRepository<ActivityEmployee, Long> {

    List<ActivityEmployee> findByActivityAndActiveTrue(Activity activity);

    List<ActivityEmployee> findByActivity(Activity activity);

    List<ActivityEmployee> findByEmployeeAndActiveTrue(User employee);

    Optional<ActivityEmployee> findByActivityAndEmployee(Activity activity, User employee);

    boolean existsByActivityAndEmployee(Activity activity, User employee);

    @Query("SELECT ae.employee FROM ActivityEmployee ae WHERE ae.activity = :activity AND ae.active = true")
    List<User> findEmployeesByActivity(@Param("activity") Activity activity);

    @Query("SELECT ae.activity FROM ActivityEmployee ae WHERE ae.employee = :employee AND ae.active = true")
    List<Activity> findActivitiesByEmployee(@Param("employee") User employee);

    void deleteByActivityAndEmployee(Activity activity, User employee);
}
