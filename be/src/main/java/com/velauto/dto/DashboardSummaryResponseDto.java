package com.velauto.dto;

import com.velauto.entity.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponseDto {

  private BigDecimal monthlyRevenue;

  private Integer todayPendingAppointments;

  private Map<PaymentMethod, BigDecimal> revenueByPaymentMethod;

  private BigDecimal totalExpenses;

  private BigDecimal netProfit;
}

