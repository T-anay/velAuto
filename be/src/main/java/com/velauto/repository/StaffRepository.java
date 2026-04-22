package com.velauto.repository;

import com.velauto.entity.Staff;
import com.velauto.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {

  // Kullanıcıya göre staff bul (soft delete filtreli)
  @Query("SELECT s FROM Staff s WHERE s.deletedAt IS NULL AND s.user = :user")
  Optional<Staff> findByUser(@Param("user") User user);

  // Tenant'a göre staff listele
  @Query("SELECT s FROM Staff s WHERE s.deletedAt IS NULL AND s.user.tenantId = :tenantId")
  List<Staff> findByUser_TenantIdAndDeletedAtIsNull(@Param("tenantId") Integer tenantId);

  // Tenant'taki staff sayısı
  @Query("SELECT COUNT(s) FROM Staff s WHERE s.deletedAt IS NULL AND s.user.tenantId = :tenantId")
  long countByUser_TenantId(@Param("tenantId") Integer tenantId);
}