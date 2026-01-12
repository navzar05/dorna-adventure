package ro.atm.backend.domain.activity.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.domain.activity.dto.AssignedEmployeeDTO;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityEmployee;
import ro.atm.backend.domain.activity.repository.ActivityEmployeeRepository;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityEmployeeService {

    private final ActivityEmployeeRepository activityEmployeeRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    /**
     * Get all employees assigned to an activity
     */
    public List<AssignedEmployeeDTO> getAssignedEmployees(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        return activityEmployeeRepository.findByActivityAndActiveTrue(activity).stream()
                .map(ae -> AssignedEmployeeDTO.fromUser(ae.getEmployee()))
                .collect(Collectors.toList());
    }

    /**
     * Assign an employee to an activity
     */
    @Transactional
    public AssignedEmployeeDTO assignEmployee(Long activityId, Long employeeId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        // Verify the user has EMPLOYEE role
        boolean isEmployee = employee.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_EMPLOYEE") || role.getName().equals("ROLE_ADMIN"));

        if (!isEmployee) {
            throw new IllegalArgumentException("User is not an employee");
        }

        // Check if already assigned
        if (activityEmployeeRepository.existsByActivityAndEmployee(activity, employee)) {
            // Reactivate if exists but inactive
            ActivityEmployee existing = activityEmployeeRepository.findByActivityAndEmployee(activity, employee)
                    .orElseThrow();
            if (!existing.getActive()) {
                existing.setActive(true);
                activityEmployeeRepository.save(existing);
            }
            return AssignedEmployeeDTO.fromUser(employee);
        }

        // Create new assignment
        ActivityEmployee activityEmployee = ActivityEmployee.builder()
                .activity(activity)
                .employee(employee)
                .active(true)
                .build();

        activityEmployeeRepository.save(activityEmployee);
        return AssignedEmployeeDTO.fromUser(employee);
    }

    /**
     * Remove an employee from an activity
     */
    @Transactional
    public void removeEmployee(Long activityId, Long employeeId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        ActivityEmployee activityEmployee = activityEmployeeRepository.findByActivityAndEmployee(activity, employee)
                .orElseThrow(() -> new EntityNotFoundException("Employee assignment not found"));

        // Soft delete by setting active = false
        activityEmployee.setActive(false);
        activityEmployeeRepository.save(activityEmployee);
    }

    /**
     * Update employee selection enabled flag for an activity
     */
    @Transactional
    public void updateEmployeeSelectionEnabled(Long activityId, Boolean enabled) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        activity.setEmployeeSelectionEnabled(enabled);
        activityRepository.save(activity);
    }

    /**
     * Bulk assign employees to an activity
     */
    @Transactional
    public List<AssignedEmployeeDTO> assignEmployees(Long activityId, List<Long> employeeIds) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        return employeeIds.stream()
                .map(employeeId -> assignEmployee(activityId, employeeId))
                .collect(Collectors.toList());
    }

    /**
     * Get all activities for an employee
     */
    public List<Activity> getActivitiesForEmployee(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        return activityEmployeeRepository.findActivitiesByEmployee(employee);
    }
}
