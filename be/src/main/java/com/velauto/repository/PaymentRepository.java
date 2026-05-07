package com.velauto.repository;

import com.velauto.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

  @Query("SELECT p FROM Payment p WHERE p.id = :id AND p.deletedAt IS NULL")
  Optional<Payment> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT p FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.deletedAt IS NULL")
  List<Payment> findByServiceFormIdAndDeletedAtIsNull(
      @Param("serviceFormId") Integer serviceFormId
  );

  @Query("SELECT p FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.deletedAt IS NULL")
  Page<Payment> findByServiceFormIdAndDeletedAtIsNullPaged(
      @Param("serviceFormId") Integer serviceFormId,
      Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.deletedAt IS NULL")
  BigDecimal sumPaymentsByServiceForm(
      @Param("serviceFormId") Integer serviceFormId
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE YEAR(p.paymentDate) = YEAR(CURRENT_DATE) AND MONTH(p.paymentDate) = MONTH(CURRENT_DATE) AND p.deletedAt IS NULL")
  BigDecimal getMonthlyRevenue();

  @Query("SELECT p.paymentMethod, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE YEAR(p.paymentDate) = YEAR(CURRENT_DATE) AND MONTH(p.paymentDate) = MONTH(CURRENT_DATE) AND p.deletedAt IS NULL GROUP BY p.paymentMethod")
  java.util.List<Object[]> getRevenueByPaymentMethod();
}
