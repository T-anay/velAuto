package com.velauto.repository;

import com.velauto.entity.RefreshToken;
import com.velauto.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

  // Token ile refresh token bul (soft delete filtreli)
  @Query("SELECT rt FROM RefreshToken rt WHERE rt.deletedAt IS NULL AND rt.token = :token")
  Optional<RefreshToken> findByToken(@Param("token") String token);

  // Kullanıcının eski tokenlarını silmek için (Logout veya yeni login durumunda)
  @Modifying
  @Transactional
  @Query("UPDATE RefreshToken rt SET rt.deletedAt = CURRENT_TIMESTAMP WHERE rt.user = :user AND rt.deletedAt IS NULL")
  void deleteByUser(@Param("user") User user);

  // Süresi dolmuş tokenları temizle (scheduled job için)
  @Modifying
  @Transactional
  @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :instant")
  void deleteByExpiryDateBefore(@Param("instant") Instant instant);
}