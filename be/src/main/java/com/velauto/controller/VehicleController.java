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
  public ResponseEntity<VehicleResponseDto> getVehicleById(@PathVariable Integer vehicleId) {
    VehicleResponseDto response = vehicleService.getVehicleById(vehicleId);
    return ResponseEntity.ok(response);
  }

  // HATA BURADAYDI: @GetMapping anotasyonu eklendi
  @GetMapping
  public ResponseEntity<Page<VehicleResponseDto>> getAllVehicles(
          @RequestParam Integer tenantId,
          @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
          @AuthenticationPrincipal CustomUserDetails userDetails) {
    log.info("Araç listesi talebi: tenantId={}, page={}", tenantId, pageable.getPageNumber());
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