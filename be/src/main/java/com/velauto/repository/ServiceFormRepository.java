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

  // Single-tenant queries with soft delete filter
  @Query("SELECT sf FROM ServiceForm sf WHERE sf.id = :id AND sf.deletedAt IS NULL")
  Optional<ServiceForm> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.deletedAt IS NULL")
  Page<ServiceForm> findByDeletedAtIsNull(
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.vehicleId = :vehicleId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByVehicleIdAndDeletedAtIsNull(
      @Param("vehicleId") Integer vehicleId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.status = :status AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByStatusAndDeletedAtIsNull(
      @Param("status") ServiceFormStatus status,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.customerId = :customerId AND sf.deletedAt IS NULL")
  Page<ServiceForm> findByCustomerIdAndDeletedAtIsNull(
      @Param("customerId") Integer customerId,
      Pageable pageable
  );

  @Query("SELECT sf FROM ServiceForm sf WHERE sf.appointmentId = :appointmentId AND sf.deletedAt IS NULL")
  Optional<ServiceForm> findByAppointmentIdAndDeletedAtIsNull(
      @Param("appointmentId") Integer appointmentId
  );

  @Query("SELECT COUNT(sf) FROM ServiceForm sf WHERE sf.deletedAt IS NULL")
  long countByDeletedAtIsNull();
}

