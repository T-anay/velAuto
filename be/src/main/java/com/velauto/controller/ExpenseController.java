package com.velauto.controller;

import com.velauto.dto.ExpenseCreateDto;
import com.velauto.dto.ExpenseUpdateDto;
import com.velauto.dto.ExpenseResponseDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

  private final ExpenseService expenseService;

  @PostMapping
  @PreAuthorize("hasAnyRole('admin', 'manager')")
  public ResponseEntity<ExpenseResponseDto> createExpense(
      @Valid @RequestBody ExpenseCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ExpenseResponseDto expense = expenseService.createExpense(request, userDetails.getTenantId(), userDetails.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED).body(expense);
  }

  @PutMapping("/{expenseId}")
  @PreAuthorize("hasAnyRole('admin', 'manager')")
  public ResponseEntity<ExpenseResponseDto> updateExpense(
      @PathVariable Integer expenseId,
      @Valid @RequestBody ExpenseUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ExpenseResponseDto expense = expenseService.updateExpense(expenseId, request, userDetails.getTenantId(), userDetails.getUserId());
    return ResponseEntity.ok(expense);
  }

  @DeleteMapping("/{expenseId}")
  @PreAuthorize("hasAnyRole('admin', 'manager')")
  public ResponseEntity<Void> deleteExpense(
      @PathVariable Integer expenseId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    expenseService.deleteExpense(expenseId, userDetails.getTenantId(), userDetails.getUserId());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{expenseId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ExpenseResponseDto> getExpenseById(
      @PathVariable Integer expenseId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ExpenseResponseDto expense = expenseService.getExpenseById(expenseId, userDetails.getTenantId());
    return ResponseEntity.ok(expense);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<ExpenseResponseDto>> getAllExpenses(
      @AuthenticationPrincipal CustomUserDetails userDetails,
      Pageable pageable
  ) {
    Page<ExpenseResponseDto> expenses = expenseService.getAllExpensesByTenant(userDetails.getTenantId(), pageable);
    return ResponseEntity.ok(expenses);
  }
}

