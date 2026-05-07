package com.velauto.service.impl;

import com.velauto.dto.DashboardSummaryResponseDto;
import com.velauto.entity.enums.AppointmentStatus;
import com.velauto.entity.enums.PaymentMethod;
import com.velauto.exception.BusinessException;
import com.velauto.repository.AppointmentRepository;
import com.velauto.repository.ExpenseRepository;
import com.velauto.repository.PaymentRepository;
import com.velauto.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

  private final PaymentRepository paymentRepository;
  private final AppointmentRepository appointmentRepository;
  private final ExpenseRepository expenseRepository;

  @Override
  public DashboardSummaryResponseDto getSummary() {
    log.info("Dashboard ozetlemesi getiriliyor");

    // Get monthly revenue
    BigDecimal monthlyRevenue = paymentRepository.getMonthlyRevenue();
    if (monthlyRevenue == null) {
      monthlyRevenue = BigDecimal.ZERO;
    }

    // Get today's pending appointments
    Integer todayPendingAppointments = appointmentRepository.countTodayPendingAppointments(
        AppointmentStatus.PENDING
    );
    if (todayPendingAppointments == null) {
      todayPendingAppointments = 0;
    }

    // Get revenue by payment method
    Map<PaymentMethod, BigDecimal> revenueByPaymentMethod = new HashMap<>();
    List<Object[]> revenueData = paymentRepository.getRevenueByPaymentMethod();

    for (Object[] row : revenueData) {
      PaymentMethod method = (PaymentMethod) row[0];
      BigDecimal amount = (BigDecimal) row[1];
      if (amount == null) {
        amount = BigDecimal.ZERO;
      }
      revenueByPaymentMethod.put(method, amount);
    }

    // Get monthly expenses
    LocalDate today = LocalDate.now();
    int currentYear = today.getYear();
    int currentMonth = today.getMonthValue();

    BigDecimal totalExpenses = expenseRepository.getMonthlyExpenses(currentYear, currentMonth);
    if (totalExpenses == null) {
      totalExpenses = BigDecimal.ZERO;
    }

    // Calculate net profit
    BigDecimal netProfit = monthlyRevenue.subtract(totalExpenses);

    log.info("Dashboard ozetlemesi hazir: monthlyRevenue={}, todayPending={}, totalExpenses={}, netProfit={}",
        monthlyRevenue, todayPendingAppointments, totalExpenses, netProfit);

    return DashboardSummaryResponseDto.builder()
        .monthlyRevenue(monthlyRevenue)
        .todayPendingAppointments(todayPendingAppointments)
        .revenueByPaymentMethod(revenueByPaymentMethod)
        .totalExpenses(totalExpenses)
        .netProfit(netProfit)
        .build();
  }
}

