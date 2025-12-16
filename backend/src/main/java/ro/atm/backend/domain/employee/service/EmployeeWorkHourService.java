package ro.atm.backend.domain.employee.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.atm.backend.domain.employee.dto.*;
import ro.atm.backend.domain.employee.entity.EmployeeWorkHour;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.employee.entity.WorkHourRequest;
import ro.atm.backend.domain.employee.repository.EmployeeWorkHourRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.employee.repository.WorkHourRequestRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeWorkHourService {

    private final WorkHourRequestRepository requestRepository;
    private final EmployeeWorkHourRepository workHourRepository;
    private final UserRepository userRepository;

    // Employee Methods

    public List<EmployeeWorkHourDTO> getMyWorkHours() {
        User currentUser = getCurrentUser();
        LocalDate today = LocalDate.now();
        List<EmployeeWorkHour> workHours = workHourRepository.findByEmployeeFromDate(currentUser, today);
        return workHours.stream()
                .map(this::convertToWorkHourDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeWorkHourDTO> getMyWorkHoursByDateRange(LocalDate startDate, LocalDate endDate) {
        User currentUser = getCurrentUser();
        List<EmployeeWorkHour> workHours = workHourRepository
                .findByEmployeeAndWorkDateBetweenOrderByWorkDate(currentUser, startDate, endDate);
        return workHours.stream()
                .map(this::convertToWorkHourDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkHourRequestDTO createRequest(WorkHourRequestCreateDTO dto) {
        User currentUser = getCurrentUser();


        // Validate date is not in the past
        if (dto.getWorkDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot create request for past dates");
        }

        // Parse and validate times if available
        LocalTime startTime = null;
        LocalTime endTime = null;
        if (dto.getIsAvailable()) {
            startTime = LocalTime.parse(dto.getStartTime());
            endTime = LocalTime.parse(dto.getEndTime());
            validateTimes(startTime, endTime);

            validateNoOverlap(currentUser, dto.getWorkDate(), startTime, endTime);
        }


        WorkHourRequest request = WorkHourRequest.builder()
                .employee(currentUser)
                .workDate(dto.getWorkDate())
                .startTime(startTime)
                .endTime(endTime)
                .isAvailable(dto.getIsAvailable())
                .notes(dto.getNotes())
                .status(WorkHourRequest.RequestStatus.PENDING)
                .build();

        WorkHourRequest savedRequest = requestRepository.save(request);
        return convertToRequestDTO(savedRequest);
    }

    @Transactional
    public List<WorkHourRequestDTO> createBulkRequest(WorkHourRequestCreateDTO dto, List<LocalDate> dates) {
        User currentUser = getCurrentUser();
        List<WorkHourRequestDTO> results = new ArrayList<>();

        // Parse times once if available
        LocalTime startTime = null;
        LocalTime endTime = null;
        if (dto.getIsAvailable()) {
            startTime = LocalTime.parse(dto.getStartTime());
            endTime = LocalTime.parse(dto.getEndTime());
            validateTimes(startTime, endTime);
        }

        for (LocalDate date : dates) {
            if (date.isBefore(LocalDate.now())) {
                continue; // Skip past dates
            }

            WorkHourRequest request = WorkHourRequest.builder()
                    .employee(currentUser)
                    .workDate(date)
                    .startTime(startTime)
                    .endTime(endTime)
                    .isAvailable(dto.getIsAvailable())
                    .notes(dto.getNotes())
                    .status(WorkHourRequest.RequestStatus.PENDING)
                    .build();

            WorkHourRequest savedRequest = requestRepository.save(request);
            results.add(convertToRequestDTO(savedRequest));
        }

        return results;
    }

    public List<WorkHourRequestDTO> getMyRequests() {
        User currentUser = getCurrentUser();
        List<WorkHourRequest> requests = requestRepository.findByEmployeeOrderByRequestedAtDesc(currentUser);
        return requests.stream()
                .map(this::convertToRequestDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelRequest(Long requestId) {
        User currentUser = getCurrentUser();
        WorkHourRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getEmployee().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only cancel your own requests");
        }

        if (request.getStatus() != WorkHourRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Can only cancel pending requests");
        }

        requestRepository.delete(request);
    }

    // Admin Methods

    public List<WorkHourRequestDTO> getAllRequests() {
        List<WorkHourRequest> requests = requestRepository.findAllByOrderByRequestedAtDesc();
        return requests.stream()
                .map(this::convertToRequestDTO)
                .collect(Collectors.toList());
    }

    public List<WorkHourRequestDTO> getPendingRequests() {
        List<WorkHourRequest> requests = requestRepository
                .findByStatusOrderByRequestedAtDesc(WorkHourRequest.RequestStatus.PENDING);
        return requests.stream()
                .map(this::convertToRequestDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkHourRequestDTO approveRequest(Long requestId) {
        User admin = getCurrentUser();
        WorkHourRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != WorkHourRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been reviewed");
        }

        validateNoOverlap(request.getEmployee(), request.getWorkDate(), request.getStartTime(), request.getEndTime());

        // Create new work hour entry (allows multiple intervals per day)
        EmployeeWorkHour workHour = EmployeeWorkHour.builder()
                .employee(request.getEmployee())
                .workDate(request.getWorkDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isAvailable(request.getIsAvailable())
                .build();

        workHourRepository.save(workHour);

        // Update request status
        request.setStatus(WorkHourRequest.RequestStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(admin);

        WorkHourRequest savedRequest = requestRepository.save(request);
        return convertToRequestDTO(savedRequest);
    }

    @Transactional
    public WorkHourRequestDTO rejectRequest(Long requestId, String reason) {
        User admin = getCurrentUser();
        WorkHourRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != WorkHourRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been reviewed");
        }

        request.setStatus(WorkHourRequest.RequestStatus.REJECTED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(admin);
        request.setRejectionReason(reason);

        WorkHourRequest savedRequest = requestRepository.save(request);
        return convertToRequestDTO(savedRequest);
    }

    public List<EmployeeWorkHourDTO> getEmployeeWorkHours(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate today = LocalDate.now();
        List<EmployeeWorkHour> workHours = workHourRepository.findByEmployeeFromDate(employee, today);
        return workHours.stream()
                .map(this::convertToWorkHourDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeWorkHourDTO> getEmployeeWorkHoursByDateRange(
            Long employeeId, LocalDate startDate, LocalDate endDate) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<EmployeeWorkHour> workHours = workHourRepository
                .findByEmployeeAndWorkDateBetweenOrderByWorkDate(employee, startDate, endDate);
        return workHours.stream()
                .map(this::convertToWorkHourDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeWorkHourDTO updateEmployeeWorkHours(Long employeeId, EmployeeWorkHourUpdateDTO dto) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        // Parse times from DTO (they are Strings)
        LocalTime startTime = LocalTime.parse(dto.getStartTime());
        LocalTime endTime = LocalTime.parse(dto.getEndTime());

        validateTimes(startTime, endTime);

        validateNoOverlap(employee, dto.getWorkDate(), startTime, endTime);

        // Check if this exact interval already exists
        List<EmployeeWorkHour> existingHours = workHourRepository.findByEmployeeAndWorkDate(employee, dto.getWorkDate());
        boolean intervalExists = existingHours.stream()
                .anyMatch(h -> h.getStartTime().equals(startTime) && h.getEndTime().equals(endTime));

        if (intervalExists) {
            throw new IllegalArgumentException("This time interval already exists for the specified date");
        }

        // Create new interval
        EmployeeWorkHour workHour = EmployeeWorkHour.builder()
                .employee(employee)
                .workDate(dto.getWorkDate())
                .startTime(startTime)
                .endTime(endTime)
                .isAvailable(dto.getIsAvailable())
                .build();

        EmployeeWorkHour savedWorkHour = workHourRepository.save(workHour);
        return convertToWorkHourDTO(savedWorkHour);
    }
    @Transactional
    public void deleteEmployeeWorkHour(Long id) {
        if (!workHourRepository.existsById(id)) {
            throw new EntityNotFoundException("Work hour not found with id: " + id);
        }
        workHourRepository.deleteById(id);
    }

    @Transactional
    public void deleteEmployeeWorkHourByDate(Long employeeId, LocalDate workDate) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        workHourRepository.deleteByEmployeeAndWorkDate(employee, workDate);
    }

    @Transactional
    public List<EmployeeWorkHourDTO> createBulkEmployeeWorkHours(
            Long employeeId, EmployeeWorkHourBulkCreateDTO dto) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Parse times from DTO (they are Strings)
        LocalTime startTime = dto.getStartTime();
        LocalTime endTime = dto.getEndTime();

        if (dto.getIsAvailable()) {
            validateTimes(startTime, endTime);
        }

        List<EmployeeWorkHourDTO> results = new ArrayList<>();

        for (LocalDate date : dto.getWorkDates()) {

            validateNoOverlap(employee, date, startTime, endTime);

            EmployeeWorkHour workHour = EmployeeWorkHour.builder()
                    .employee(employee)
                    .workDate(date)
                    .startTime(startTime)
                    .endTime(endTime)
                    .isAvailable(dto.getIsAvailable())
                    .build();

            EmployeeWorkHour savedWorkHour = workHourRepository.save(workHour);
            results.add(convertToWorkHourDTO(savedWorkHour));
        }

        return results;
    }

    // Helper Methods

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateTimes(LocalTime startTime, LocalTime endTime) {
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new RuntimeException("End time must be after start time");
        }
    }

    private void validateNoOverlap(User employee, LocalDate date, LocalTime newStart, LocalTime newEnd) {
        List<EmployeeWorkHour> existingHours = workHourRepository.findByEmployeeAndWorkDate(employee, date);

        boolean hasOverlap = existingHours.stream().anyMatch(existing -> {
            LocalTime existStart = existing.getStartTime();
            LocalTime existEnd = existing.getEndTime();

            return newStart.isBefore(existEnd) && newEnd.isAfter(existStart);
        });

        if (hasOverlap) {
            throw new RuntimeException(
                    String.format("Overlapping work hours detected for employee %s on %s. New interval: %s-%s",
                            employee.getUsername(), date, newStart, newEnd)
            );
        }
    }

    private WorkHourRequestDTO convertToRequestDTO(WorkHourRequest request) {
        return WorkHourRequestDTO.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeName(request.getEmployee().getFirstName() + " " + request.getEmployee().getLastName())
                .workDate(request.getWorkDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isAvailable(request.getIsAvailable())
                .status(request.getStatus())
                .notes(request.getNotes())
                .requestedAt(request.getRequestedAt())
                .reviewedAt(request.getReviewedAt())
                .reviewedBy(request.getReviewedBy() != null ?
                        request.getReviewedBy().getFirstName() + " " + request.getReviewedBy().getLastName() : null)
                .rejectionReason(request.getRejectionReason())
                .build();
    }

    private EmployeeWorkHourDTO convertToWorkHourDTO(EmployeeWorkHour workHour) {
        return EmployeeWorkHourDTO.builder()
                .id(workHour.getId())
                .employeeId(workHour.getEmployee().getId())
                .workDate(workHour.getWorkDate())
                .startTime(workHour.getStartTime())
                .endTime(workHour.getEndTime())
                .isAvailable(workHour.isAvailable())
                .build();
    }
}