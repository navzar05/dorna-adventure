package ro.atm.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.dto.WorkHoursDTO;
import ro.atm.backend.service.WorkHoursService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/work-hours")
@RequiredArgsConstructor
public class WorkHoursController {

    private final WorkHoursService workHoursService;

    @GetMapping
    public ResponseEntity<List<WorkHoursDTO>> getAllWorkHours() {
        return ResponseEntity.ok(workHoursService.getAllWorkHours());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkHoursDTO> createOrUpdateWorkHours(@RequestBody WorkHoursDTO dto) {
        return ResponseEntity.ok(workHoursService.createOrUpdateWorkHours(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWorkHours(@PathVariable Long id) {
        workHoursService.deleteWorkHours(id);
        return ResponseEntity.noContent().build();
    }
}