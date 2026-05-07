package com.velauto.controller;

import com.velauto.dto.AppointmentCreateDto;
import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.AppointmentUpdateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

  private final AppointmentService appointmentService;

  @PostMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'admin', 'manager', 'staff')")
  public ResponseEntity<AppointmentResponseDto> createAppointment(
      @Valid @RequestBody AppointmentCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    AppointmentResponseDto response = appointmentService.createAppointment(
        request,
        userDetails.getUserId()
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff', 'customer')")
  public ResponseEntity<AppointmentResponseDto> getAppointmentById(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    AppointmentResponseDto response = appointmentService.getAppointmentById(
        id,
        userDetails.getUserId()
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff', 'customer')")
  public ResponseEntity<Page<AppointmentResponseDto>> getAppointmentsByTenant(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AppointmentResponseDto> response = appointmentService.getAppointmentsByTenant(
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/customer/{customerId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<AppointmentResponseDto>> getAppointmentsByCustomer(
      @PathVariable Integer customerId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AppointmentResponseDto> response = appointmentService.getAppointmentsByCustomer(
        customerId,
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/vehicle/{vehicleId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<AppointmentResponseDto>> getAppointmentsByVehicle(
      @PathVariable Integer vehicleId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AppointmentResponseDto> response = appointmentService.getAppointmentsByVehicle(
        vehicleId,
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/range")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<List<AppointmentResponseDto>> getAppointmentsByDateRange(
      @RequestParam LocalDateTime startDate,
      @RequestParam LocalDateTime endDate,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    List<AppointmentResponseDto> response = appointmentService.getAppointmentsByDateRange(
        startDate,
        endDate
    );
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<AppointmentResponseDto> updateAppointment(
      @PathVariable Integer id,
      @Valid @RequestBody AppointmentUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    AppointmentResponseDto response = appointmentService.updateAppointment(
        id,
        request,
        userDetails.getUserId()
    );
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Void> deleteAppointment(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    appointmentService.deleteAppointment(
        id,
        userDetails.getUserId()
    );
    return ResponseEntity.noContent().build();
  }

  /**
   * Public Online Appointment Booking
   * POST /api/v1/appointments/public/{tenantId}/book
   * - No JWT required (permitAll)
   * - TenantId: Path variable (hybrid strategy, CORS uyumu için)
   * - Form-data ile multipart file upload
   * - Müşteri/araç otomatik tespiti ve yaratma
   * - Status: PENDING (Onay Bekliyor)
   */
  @PostMapping("/public/{tenantId}/book")
  public ResponseEntity<AppointmentResponseDto> bookPublicAppointment(
      @PathVariable Integer tenantId,
      @ModelAttribute com.velauto.dto.PublicAppointmentRequestDto request
  ) {

    if (tenantId == null || tenantId <= 0) {
      return ResponseEntity.badRequest().build();
    }

    AppointmentResponseDto response = appointmentService.bookOnlineAppointment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
