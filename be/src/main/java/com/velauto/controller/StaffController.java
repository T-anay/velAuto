package com.velauto.controller;

import com.velauto.dto.StaffResponseDto;
import com.velauto.dto.StaffUpdateDto;
import com.velauto.exception.BusinessException;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

  private final StaffService staffService;

  @GetMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'admin', 'manager', 'staff')")
  public ResponseEntity<List<StaffResponseDto>> getAllStaff() {
    return ResponseEntity.ok(staffService.getAllStaff());
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'admin')")
  public ResponseEntity<StaffResponseDto> updateStaff(
      @PathVariable Integer id,
      @Valid @RequestBody StaffUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    validateStaffId(id);
    StaffResponseDto response = staffService.updateStaff(id, request, userDetails.getUserId());
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'admin')")
  public ResponseEntity<Void> deleteStaff(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    validateStaffId(id);
    staffService.deleteStaff(id, userDetails.getUserId());
    return ResponseEntity.noContent().build();
  }

  private void validateStaffId(Integer id) {
    if (id == null || id <= 0) {
      throw new BusinessException("Geçersiz personel ID'si", HttpStatus.BAD_REQUEST);
    }
  }
}
