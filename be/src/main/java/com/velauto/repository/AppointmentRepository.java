package com.velauto.repository;

import com.velauto.entity.Appointment;
import com.velauto.entity.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

  // Multi-tenant queries with soft delete filter
  @Query("SELECT a FROM Appointment a WHERE a.id = :id AND a.tenantId = :tenantId AND a.deletedAt IS NULL")
  Optional<Appointment> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT a FROM Appointment a WHERE a.customerId = :customerId AND a.tenantId = :tenantId AND a.deletedAt IS NULL")
  Page<Appointment> findByCustomerIdAndTenantId(
      @Param("customerId") Integer customerId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.vehicleId = :vehicleId AND a.tenantId = :tenantId AND a.deletedAt IS NULL")
  Page<Appointment> findByVehicleIdAndTenantId(
      @Param("vehicleId") Integer vehicleId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId AND a.deletedAt IS NULL")
  Page<Appointment> findByTenantId(
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId AND a.status = :status AND a.deletedAt IS NULL")
  List<Appointment> findByTenantIdAndStatus(
      @Param("tenantId") Integer tenantId,
      @Param("status") AppointmentStatus status
  );

  @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId AND a.appointmentDate >= :startDate AND a.appointmentDate <= :endDate AND a.deletedAt IS NULL")
  List<Appointment> findByTenantIdAndDateRange(
      @Param("tenantId") Integer tenantId,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate
  );

  @Query("SELECT COUNT(a) FROM Appointment a WHERE a.tenantId = :tenantId AND a.deletedAt IS NULL")
  long countByTenantId(@Param("tenantId") Integer tenantId);

  @Query("SELECT COUNT(a) FROM Appointment a WHERE a.tenantId = :tenantId AND a.status = :status AND DATE(a.appointmentDate) = CURRENT_DATE AND a.deletedAt IS NULL")
  Integer countTodayPendingAppointments(@Param("tenantId") Integer tenantId, @Param("status") AppointmentStatus status);
}
