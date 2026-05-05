package com.velauto.service;

import com.velauto.dto.DashboardSummaryResponseDto;

public interface DashboardService {

  DashboardSummaryResponseDto getSummary(Integer tenantId);
}

