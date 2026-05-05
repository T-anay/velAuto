package com.velauto.repository;

import com.velauto.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

  @Query("SELECT e FROM Expense e WHERE e.id = :id AND e.tenantId = :tenantId AND e.deletedAt IS NULL")
  Optional<Expense> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT e FROM Expense e WHERE e.tenantId = :tenantId AND e.deletedAt IS NULL ORDER BY e.expenseDate DESC")
  List<Expense> findByTenantId(@Param("tenantId") Integer tenantId);

  @Query("SELECT e FROM Expense e WHERE e.tenantId = :tenantId AND e.deletedAt IS NULL ORDER BY e.expenseDate DESC")
  Page<Expense> findByTenantIdPaged(
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.tenantId = :tenantId AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month AND e.deletedAt IS NULL")
  BigDecimal getMonthlyExpenses(
      @Param("tenantId") Integer tenantId,
      @Param("year") int year,
      @Param("month") int month
  );
}

