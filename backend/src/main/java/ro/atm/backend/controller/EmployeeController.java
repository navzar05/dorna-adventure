package ro.atm.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.dto.EmployeeDTO;
import ro.atm.backend.dto.EmployeeSwapInfo;
import ro.atm.backend.dto.EmployeeSwapOptions;
import ro.atm.backend.dto.EmployeeSwapRequest;
import ro.atm.backend.service.EmployeeService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeDTO> createEmployee(
            @RequestBody Map<String, Object> request) {

        EmployeeDTO dto = new EmployeeDTO();
        dto.setUsername((String) request.get("username"));
        dto.setEmail((String) request.get("email"));
        dto.setFirstName((String) request.get("firstName"));
        dto.setLastName((String) request.get("lastName"));
        dto.setPhoneNumber((String) request.get("phoneNumber"));
        dto.setEnabled((Boolean) request.getOrDefault("enabled", true));

        String password = (String) request.get("password");

        return ResponseEntity.ok(employeeService.createEmployee(dto, password));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long id,
            @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookingId}/check-swap/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeSwapInfo> checkEmployeeSwap(
            @PathVariable Long bookingId,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeService.checkEmployeeSwap(bookingId, employeeId));
    }

    @PostMapping("/swap-employees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> swapEmployees(@RequestBody EmployeeSwapRequest request) {
        employeeService.swapEmployees(request.getBooking1Id(), request.getBooking2Id());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{bookingId}/swap-options/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeSwapOptions> getEmployeeSwapOptions(
            @PathVariable Long bookingId,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeService.getEmployeeSwapOptions(bookingId, employeeId));
    }
}