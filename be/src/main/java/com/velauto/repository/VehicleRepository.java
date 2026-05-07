package com.velauto.repository;

import com.velauto.entity.Staff;
import com.velauto.entity.Vehicle;
import com.velauto.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

  // FUTURE NOTE: Soft delete filtresini değiştirmek için "deleted_at IS NULL" klauzülünü güncelleyin

  // Plakaya göre araç bulma (soft delete filtreli)
  @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.licensePlate = :licensePlate")
  Optional<Vehicle> findByLicensePlate(@Param("licensePlate") String licensePlate);

  // Müşteriye ait araçları listele (Pagination + soft delete filtreli)
  @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.customer = :customer")
  Page<Vehicle> findByCustomer(@Param("customer") Customer customer, Pageable pageable);

  // Staff'a atanan araçları listele (Pagination + soft delete filtreli)
  // FUTURE NOTE: Staff atama kontrolü için bu sorgu kullanılır
  @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.assignedStaff = :staff")
  Page<Vehicle> findByAssignedStaff(@Param("staff") Staff staff, Pageable pageable);

  // Soft delete filtreli araçları listele (Pagination)
  @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL")
  Page<Vehicle> findAllByDeletedAtIsNull(Pageable pageable);

  // Plakaya göre araç + geçmiş bilgileri eager loading ile çek
  // FUTURE NOTE: Hızlı sorgulama için ServiceForm ve Appointment join'leri yapılır
  @Query("SELECT DISTINCT v FROM Vehicle v " +
         "LEFT JOIN FETCH v.customer " +
         "LEFT JOIN FETCH v.assignedStaff " +
         "WHERE v.deletedAt IS NULL AND v.licensePlate = :licensePlate")
  Optional<Vehicle> findByLicensePlateWithDetails(@Param("licensePlate") String licensePlate);

  // Customer ID ve plakaya göre araç bulma (public booking için)
  @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.customer.id = :customerId AND v.licensePlate = :licensePlate")
  Optional<Vehicle> findByCustomerIdAndPlate(@Param("customerId") Integer customerId, @Param("licensePlate") String licensePlate);
}
