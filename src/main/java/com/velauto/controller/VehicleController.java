package com.velauto.controller;

import com.velauto.dto.AssignStaffDto;
import com.velauto.dto.VehicleCreateDto;
import com.velauto.dto.VehicleResponseDto;
import com.velauto.dto.VehicleUpdateDto;
import com.velauto.dto.VehicleWithHistoryDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

  private final VehicleService vehicleService;

  @PostMapping
  public ResponseEntity<VehicleResponseDto> createVehicle(
      @Valid @RequestBody VehicleCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleResponseDto response = vehicleService.createVehicle(request, userDetails.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{vehicleId}")
  public ResponseEntity<VehicleResponseDto> getVehicleById(
      @PathVariable Integer vehicleId,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleResponseDto response = vehicleService.getVehicleById(vehicleId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/plate/{licensePlate}")
  public ResponseEntity<VehicleResponseDto> getByLicensePlate(
      @PathVariable String licensePlate,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleResponseDto response = vehicleService.getByLicensePlate(licensePlate);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/history/{licensePlate}")
  public ResponseEntity<VehicleWithHistoryDto> getVehicleWithHistory(
      @PathVariable String licensePlate,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleWithHistoryDto response = vehicleService.getVehicleWithHistory(licensePlate);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/my-vehicles/{customerId}")
  public ResponseEntity<Page<VehicleResponseDto>> getMyVehicles(
      @PathVariable Integer customerId,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Page<VehicleResponseDto> response = vehicleService.getVehiclesByCustomer(customerId, pageable);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/assigned-vehicles/{staffId}")
  public ResponseEntity<Page<VehicleResponseDto>> getAssignedVehicles(
      @PathVariable Integer staffId,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Page<VehicleResponseDto> response = vehicleService.getAssignedVehicles(staffId, pageable);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/all")
  public ResponseEntity<Page<VehicleResponseDto>> getAllVehicles(
      @RequestParam Integer tenantId,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Page<VehicleResponseDto> response = vehicleService.getAllVehicles(tenantId, pageable);
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{vehicleId}")
  public ResponseEntity<VehicleResponseDto> updateVehicle(
      @PathVariable Integer vehicleId,
      @Valid @RequestBody VehicleUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleResponseDto response = vehicleService.updateVehicle(vehicleId, request, userDetails.getUserId());
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{vehicleId}/assign-staff")
  public ResponseEntity<VehicleResponseDto> assignStaff(
      @PathVariable Integer vehicleId,
      @Valid @RequestBody AssignStaffDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    VehicleResponseDto response = vehicleService.assignStaff(vehicleId, request, userDetails.getUserId());
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{vehicleId}")
  public ResponseEntity<Void> deleteVehicle(
      @PathVariable Integer vehicleId,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    vehicleService.deleteVehicle(vehicleId, userDetails.getUserId());
    return ResponseEntity.noContent().build();
  }
}


