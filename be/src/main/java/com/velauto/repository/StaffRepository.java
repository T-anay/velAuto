package com.velauto.repository;

import com.velauto.entity.Staff;
import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
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

  // Soft delete filtreli staff listele
  @Query("SELECT s FROM Staff s WHERE s.deletedAt IS NULL")
  List<Staff> findByDeletedAtIsNull();

  // Soft delete filtreli staff sayısı
  @Query("SELECT COUNT(s) FROM Staff s WHERE s.deletedAt IS NULL")
  long countByDeletedAtIsNull();

  @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Staff s WHERE s.deletedAt IS NULL AND s.user.deletedAt IS NULL AND s.user.role = :role")
  boolean existsActiveStaffByUserRole(@Param("role") Role role);
}
