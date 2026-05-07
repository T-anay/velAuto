package com.velauto.service;

import com.velauto.dto.ExpenseCreateDto;
import com.velauto.dto.ExpenseUpdateDto;
import com.velauto.dto.ExpenseResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpenseService {

  ExpenseResponseDto createExpense(ExpenseCreateDto request, Integer userId);

  ExpenseResponseDto updateExpense(Integer expenseId, ExpenseUpdateDto request, Integer userId);

  void deleteExpense(Integer expenseId, Integer userId);

  ExpenseResponseDto getExpenseById(Integer expenseId);

  Page<ExpenseResponseDto> getAllExpensesByTenant(Pageable pageable);
}

