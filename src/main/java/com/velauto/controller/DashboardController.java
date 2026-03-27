package com.velauto.controller;

import com.velauto.dto.DashboardSummaryResponseDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

  private final DashboardService dashboardService;

  @GetMapping("/summary")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<DashboardSummaryResponseDto> getSummary(
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    DashboardSummaryResponseDto summary = dashboardService.getSummary(userDetails.getTenantId());

    return ResponseEntity.ok(summary);
  }
}

