package com.velauto.repository;

import com.velauto.entity.PasswordResetToken;
import com.velauto.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

  Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

  void deleteByExpiryDateBefore(Instant instant);

  void deleteByUserAndUsedFalse(User user);
}

