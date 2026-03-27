package com.velauto.controller;

import com.velauto.dto.ServiceFormCreateDto;
import com.velauto.dto.ServiceFormResponseDto;
import com.velauto.dto.ServiceFormUpdateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.ServiceFormService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/service-forms")
@RequiredArgsConstructor
public class ServiceFormController {

  private final ServiceFormService serviceFormService;

  @PostMapping("/from-appointment/{appointmentId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormResponseDto> createFromAppointment(
      @PathVariable Integer appointmentId,
      @Valid @RequestBody ServiceFormCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormResponseDto response = serviceFormService.createFromAppointment(
        appointmentId,
        request,
        userDetails.getTenantId(),
        userDetails.getUserId()
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/direct")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormResponseDto> createDirectly(
      @Valid @RequestBody ServiceFormCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormResponseDto response = serviceFormService.createDirectly(
        request,
        userDetails.getTenantId(),
        userDetails.getUserId()
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff', 'customer')")
  public ResponseEntity<ServiceFormResponseDto> getServiceFormById(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormResponseDto response = serviceFormService.getServiceFormById(
        id,
        userDetails.getTenantId()
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff', 'customer')")
  public ResponseEntity<Page<ServiceFormResponseDto>> getServiceFormsByTenant(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ServiceFormResponseDto> response = serviceFormService.getServiceFormsByTenant(
        userDetails.getTenantId(),
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/vehicle/{vehicleId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<ServiceFormResponseDto>> getServiceFormsByVehicle(
      @PathVariable Integer vehicleId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ServiceFormResponseDto> response = serviceFormService.getServiceFormsByVehicle(
        vehicleId,
        userDetails.getTenantId(),
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/customer/{customerId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<ServiceFormResponseDto>> getServiceFormsByCustomer(
      @PathVariable Integer customerId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ServiceFormResponseDto> response = serviceFormService.getServiceFormsByCustomer(
        customerId,
        userDetails.getTenantId(),
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormResponseDto> updateServiceForm(
      @PathVariable Integer id,
      @Valid @RequestBody ServiceFormUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormResponseDto response = serviceFormService.updateServiceForm(
        id,
        request,
        userDetails.getTenantId(),
        userDetails.getUserId()
    );
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Void> deleteServiceForm(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    serviceFormService.deleteServiceForm(
        id,
        userDetails.getTenantId(),
        userDetails.getUserId()
    );
    return ResponseEntity.noContent().build();
  }
}

