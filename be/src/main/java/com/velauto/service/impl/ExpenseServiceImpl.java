package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.ExpenseCreateDto;
import com.velauto.dto.ExpenseUpdateDto;
import com.velauto.dto.ExpenseResponseDto;
import com.velauto.entity.Expense;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.ExpenseMapper;
import com.velauto.repository.ExpenseRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

  private final ExpenseRepository expenseRepository;
  private final ExpenseMapper expenseMapper;
  private final AuditLogService auditLogService;

  @Override
  public ExpenseResponseDto createExpense(ExpenseCreateDto request, Integer userId) {
    // Guard Clause: Validate input
    if (request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Map DTO to Entity
    Expense expense = expenseMapper.toExpense(request);
    expense.setCreatedBy(userId);
    expense.setCreatedAt(LocalDateTime.now());

    // Save expense
    Expense savedExpense = expenseRepository.save(expense);

    String auditDetails = String.format(
        "Gider oluşturuldu: tutar=%s, kategori=%s, tarih=%s",
        savedExpense.getAmount(),
        savedExpense.getCategory().getDisplayName(),
        savedExpense.getExpenseDate()
    );
    auditLogService.log(userId, "EXPENSE_CREATED", "EXPENSE", savedExpense.getId(), auditDetails);

    return expenseMapper.toResponseDto(savedExpense);
  }

  @Override
  public ExpenseResponseDto updateExpense(Integer expenseId, ExpenseUpdateDto request, Integer userId) {
    // Guard Clause: Validate input
    if (expenseId == null || request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch expense
    Optional<Expense> expenseOptional = expenseRepository.findByIdAndDeletedAtIsNull(expenseId);
    if (expenseOptional.isEmpty()) {
      throw new BusinessException(Messages.EXPENSE_NOT_FOUND);
    }

    Expense expense = expenseOptional.get();

    // Guard Clause: Already deleted?
    if (expense.getDeletedAt() != null) {
      throw new BusinessException(Messages.EXPENSE_DELETED);
    }

    // Update expense
    expenseMapper.updateExpense(request, expense);
    expense.setUpdatedBy(userId);
    expense.setUpdatedAt(LocalDateTime.now());

    Expense updatedExpense = expenseRepository.save(expense);

    String auditDetails = String.format(
        "Gider güncellendi: tutar=%s, kategori=%s, tarih=%s",
        updatedExpense.getAmount(),
        updatedExpense.getCategory().getDisplayName(),
        updatedExpense.getExpenseDate()
    );
    auditLogService.log(userId, "EXPENSE_UPDATED", "EXPENSE", updatedExpense.getId(), auditDetails);

    return expenseMapper.toResponseDto(updatedExpense);
  }

  @Override
  public void deleteExpense(Integer expenseId, Integer userId) {
    // Guard Clause: Validate input
    if (expenseId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch expense
    Optional<Expense> expenseOptional = expenseRepository.findByIdAndDeletedAtIsNull(expenseId);
    if (expenseOptional.isEmpty()) {
      throw new BusinessException(Messages.EXPENSE_NOT_FOUND);
    }

    Expense expense = expenseOptional.get();

    // Guard Clause: Already deleted?
    if (expense.getDeletedAt() != null) {
      throw new BusinessException(Messages.EXPENSE_ALREADY_DELETED);
    }

    // Soft delete
    LocalDateTime now = LocalDateTime.now();
    expense.setDeletedAt(now);
    expense.setDeletedBy(userId);
    expenseRepository.save(expense);
    log.info("Expense deleted: id={}", expenseId);

    // Audit log
    String auditDetails = String.format(
        "Gider silindi: tutar=%s, kategori=%s",
        expense.getAmount(),
        expense.getCategory().getDisplayName()
    );
    auditLogService.log(userId, "EXPENSE_DELETED", "EXPENSE", expenseId, auditDetails);
  }

  @Override
  @Transactional(readOnly = true)
  public ExpenseResponseDto getExpenseById(Integer expenseId) {
    // Guard Clause: Validate input
    if (expenseId == null) {
      throw new BusinessException(Messages.EXPENSE_NOT_FOUND);
    }

    // Fetch expense
    Optional<Expense> expenseOptional = expenseRepository.findByIdAndDeletedAtIsNull(expenseId);
    if (expenseOptional.isEmpty()) {
      throw new BusinessException(Messages.EXPENSE_NOT_FOUND);
    }

    Expense expense = expenseOptional.get();
    return expenseMapper.toResponseDto(expense);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ExpenseResponseDto> getAllExpensesByTenant(Pageable pageable) {
    // Guard Clause: Validate input
    if (pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<Expense> expenses = expenseRepository.findByDeletedAtIsNullOrderByIdDescPaged(pageable);
    return expenses.map(expenseMapper::toResponseDto);
  }
}

