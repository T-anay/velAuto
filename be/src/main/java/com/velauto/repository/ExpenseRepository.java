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

  @Query("SELECT e FROM Expense e WHERE e.id = :id AND e.deletedAt IS NULL")
  Optional<Expense> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT e FROM Expense e WHERE e.deletedAt IS NULL ORDER BY e.expenseDate DESC")
  List<Expense> findByDeletedAtIsNullOrderByIdDesc();

  @Query("SELECT e FROM Expense e WHERE e.deletedAt IS NULL ORDER BY e.expenseDate DESC")
  Page<Expense> findByDeletedAtIsNullOrderByIdDescPaged(
      Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month AND e.deletedAt IS NULL")
  BigDecimal getMonthlyExpenses(
      @Param("year") int year,
      @Param("month") int month
  );
}

