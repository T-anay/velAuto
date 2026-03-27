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

  @Query("SELECT p FROM Payment p WHERE p.id = :id AND p.tenantId = :tenantId AND p.deletedAt IS NULL")
  Optional<Payment> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT p FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.tenantId = :tenantId AND p.deletedAt IS NULL")
  List<Payment> findByServiceFormIdAndTenantId(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT p FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.tenantId = :tenantId AND p.deletedAt IS NULL")
  Page<Payment> findByServiceFormIdAndTenantIdPaged(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.serviceFormId = :serviceFormId AND p.tenantId = :tenantId AND p.deletedAt IS NULL")
  BigDecimal sumPaymentsByServiceFormAndTenant(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenantId = :tenantId AND YEAR(p.paymentDate) = YEAR(CURRENT_DATE) AND MONTH(p.paymentDate) = MONTH(CURRENT_DATE) AND p.deletedAt IS NULL")
  BigDecimal getMonthlyRevenue(@Param("tenantId") Integer tenantId);

  @Query("SELECT p.paymentMethod, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenantId = :tenantId AND YEAR(p.paymentDate) = YEAR(CURRENT_DATE) AND MONTH(p.paymentDate) = MONTH(CURRENT_DATE) AND p.deletedAt IS NULL GROUP BY p.paymentMethod")
  java.util.List<Object[]> getRevenueByPaymentMethod(@Param("tenantId") Integer tenantId);
}
