package com.velauto.repository;

import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

  // Giriş (Login) için: Kullanıcıyı emaili ile bulur (soft delete filtreli)
  @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.email = :email")
  Optional<User> findByEmail(@Param("email") String email);

  // Kayıt (Register) için: Email sistemde var mı? (soft delete filtreli)
  @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.deletedAt IS NULL AND u.email = :email")
  boolean existsByEmail(@Param("email") String email);

  // Soft delete filtreli kullanıcıları listele
  @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
  List<User> findByDeletedAtIsNull();

  // Belirli bir kullanıcının oluşturduğu belirli role'deki kullanıcıları bul
  @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.createdBy = :createdBy AND u.role = :role")
  List<User> findByCreatedByAndRoleAndDeletedAtIsNull(@Param("createdBy") Integer createdBy, @Param("role") Role role);

  // ID ile kullanıcı bul (soft delete filtreli)
  @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.id = :id")
  Optional<User> findByIdAndDeletedAtIsNull(@Param("id") Integer id);

  // Phone ile kullanıcı ara (Public booking için)
  @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.phone = :phone")
  Optional<User> findByPhoneAndDeletedAtIsNull(@Param("phone") String phone);
}