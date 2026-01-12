package ro.atm.backend.domain.employee.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.employee.dto.*;
import ro.atm.backend.domain.employee.service.EmployeeWorkHourService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/work-hours")
@RequiredArgsConstructor
public class EmployeeWorkHourController {

    private final EmployeeWorkHourService employeeWorkHourService;

    // Employee Endpoints

    @GetMapping("/my-hours")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<EmployeeWorkHourDTO>> getMyWorkHours() {
        return ResponseEntity.ok(employeeWorkHourService.getMyWorkHours());
    }

    @GetMapping("/my-hours/range")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<EmployeeWorkHourDTO>> getMyWorkHoursByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(employeeWorkHourService.getMyWorkHoursByDateRange(startDate, endDate));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<WorkHourRequestDTO> createRequest(
            @RequestBody WorkHourRequestCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeWorkHourService.createRequest(dto));
    }

    @GetMapping("/requests/my-requests")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<WorkHourRequestDTO>> getMyRequests() {
        return ResponseEntity.ok(employeeWorkHourService.getMyRequests());
    }

    @DeleteMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long id) {
        employeeWorkHourService.cancelRequest(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/my-hours/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Void> deleteMyWorkHour(@PathVariable Long id) {
        employeeWorkHourService.deleteMyWorkHour(id);
        return ResponseEntity.noContent().build();
    }

    // Admin Endpoints

    @GetMapping("/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WorkHourRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(employeeWorkHourService.getAllRequests());
    }

    @GetMapping("/requests/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WorkHourRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(employeeWorkHourService.getPendingRequests());
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkHourRequestDTO> approveRequest(@PathVariable Long id) {
        return ResponseEntity.ok(employeeWorkHourService.approveRequest(id));
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkHourRequestDTO> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(employeeWorkHourService.rejectRequest(id, reason));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmployeeWorkHourDTO>> getEmployeeWorkHours(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeWorkHourService.getEmployeeWorkHours(employeeId));
    }

    @GetMapping("/employee/{employeeId}/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmployeeWorkHourDTO>> getEmployeeWorkHoursByDateRange(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(
                employeeWorkHourService.getEmployeeWorkHoursByDateRange(employeeId, startDate, endDate));
    }

    @PutMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeWorkHourDTO> updateEmployeeWorkHours(
            @PathVariable Long employeeId,
            @RequestBody EmployeeWorkHourUpdateDTO dto) {
        return ResponseEntity.ok(employeeWorkHourService.updateEmployeeWorkHours(employeeId, dto));
    }

    @PostMapping("/employee/{employeeId}/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmployeeWorkHourDTO>> createBulkEmployeeWorkHours(
            @PathVariable Long employeeId,
            @RequestBody EmployeeWorkHourBulkCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeWorkHourService.createBulkEmployeeWorkHours(employeeId, dto));
    }

    @DeleteMapping("/employee/hours/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEmployeeWorkHour(@PathVariable Long id) {
        employeeWorkHourService.deleteEmployeeWorkHour(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/employee/{employeeId}/date/{workDate}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEmployeeWorkHourByDate(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate) {
        employeeWorkHourService.deleteEmployeeWorkHourByDate(employeeId, workDate);
        return ResponseEntity.noContent().build();
    }
}