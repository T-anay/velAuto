package com.velauto.repository;

import com.velauto.entity.ServiceForm;
import com.velauto.entity.enums.ServiceFormStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceFormRepository extends JpaRepository<ServiceForm, Integer> {

  // Multi-tenant queries with soft delete filter
  @Query("SELECT sf FROM ServiceForm sf WHERE sf.id = :id AND sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Optional<ServiceForm> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByTenantId(
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.vehicleId = :vehicleId AND sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByVehicleIdAndTenantId(
      @Param("vehicleId") Integer vehicleId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.status = :status AND sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByStatusAndTenantId(
      @Param("status") ServiceFormStatus status,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.customerId = :customerId AND sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByCustomerIdAndTenantId(
      @Param("customerId") Integer customerId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.appointmentId = :appointmentId AND sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  Optional<ServiceForm> findByAppointmentIdAndTenantId(
      @Param("appointmentId") Integer appointmentId,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT COUNT(sf) FROM ServiceForm sf WHERE sf.tenantId = :tenantId AND sf.deletedAt IS NULL")
  long countByTenantId(@Param("tenantId") Integer tenantId);
}

