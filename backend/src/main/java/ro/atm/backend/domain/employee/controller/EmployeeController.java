package ro.atm.backend.domain.employee.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ro.atm.backend.domain.employee.dto.*;
import ro.atm.backend.domain.user.dto.UserDTO;
import ro.atm.backend.domain.auth.dto.TotpSetupResponse;
import ro.atm.backend.domain.auth.dto.TotpSetupRequest;
import ro.atm.backend.domain.auth.dto.TotpVerifyRequest;
import ro.atm.backend.domain.employee.service.EmployeeService;

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


    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateEmployee(
            @PathVariable Long id,
            @RequestBody CreateEmployeeRequest request) {  // ✅ Changed from EmployeeDTO to CreateEmployeeRequest
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
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

    @PostMapping("/{id}/totp/setup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TotpSetupResponse> setupTotp(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.setupTotp(id));
    }

    @PostMapping("/{id}/totp/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> verifyTotp(@PathVariable Long id, @RequestBody TotpSetupRequest request) {
        try {
            employeeService.verifyAndEnableTotp(id, request.getVerificationCode());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/totp")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableTotp(@PathVariable Long id) {
        employeeService.disableTotp(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/totp/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TotpSetupResponse> generateTotpForNewUser(@RequestParam String username) {
        return ResponseEntity.ok(employeeService.generateTotpForNewUser(username));
    }

    @PostMapping("/totp/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Boolean> verifyTotpCode(@RequestBody TotpVerifyRequest request) {
        boolean valid = false;
        try {
            valid = employeeService.verifyTotpCode(request.getSecret(), request.getCode());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(valid);
        }
        return ResponseEntity.ok(valid);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> createEmployee(@RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }
}