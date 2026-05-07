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

  // Single-tenant queries with soft delete filter
  @Query("SELECT a FROM Appointment a WHERE a.id = :id AND a.deletedAt IS NULL")
  Optional<Appointment> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT a FROM Appointment a WHERE a.customerId = :customerId AND a.deletedAt IS NULL")
  Page<Appointment> findByCustomerIdAndDeletedAtIsNull(
      @Param("customerId") Integer customerId,
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.vehicleId = :vehicleId AND a.deletedAt IS NULL")
  Page<Appointment> findByVehicleIdAndDeletedAtIsNull(
      @Param("vehicleId") Integer vehicleId,
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.deletedAt IS NULL")
  Page<Appointment> findAllByDeletedAtIsNull(
      Pageable pageable
  );

  @Query("SELECT a FROM Appointment a WHERE a.status = :status AND a.deletedAt IS NULL")
  List<Appointment> findByStatusAndDeletedAtIsNull(
      @Param("status") AppointmentStatus status
  );

  @Query("SELECT a FROM Appointment a WHERE a.appointmentDate >= :startDate AND a.appointmentDate <= :endDate AND a.deletedAt IS NULL")
  List<Appointment> findByDateRangeAndDeletedAtIsNull(
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate
  );

  @Query("SELECT COUNT(a) FROM Appointment a WHERE a.deletedAt IS NULL")
  long countByDeletedAtIsNull();

  @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status AND DATE(a.appointmentDate) = CURRENT_DATE AND a.deletedAt IS NULL")
  Integer countTodayPendingAppointments(@Param("status") AppointmentStatus status);
}
