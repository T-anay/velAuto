package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.entity.RefreshToken;
import com.velauto.entity.User;
import com.velauto.exception.BusinessException;
import com.velauto.repository.PasswordResetTokenRepository;
import com.velauto.repository.RefreshTokenRepository;
import com.velauto.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;

  @Value("${app.jwt.refresh-expiration-ms}")
  private long refreshTokenDurationMs;

  @Override
  @Transactional
  public RefreshToken createRefreshToken(User user) {
    // Expiry date hesapla
    Instant expiryDate = Instant.now().plusMillis(refreshTokenDurationMs);

    // Token üret
    String tokenValue = UUID.randomUUID().toString();

    // RefreshToken nesnesi oluştur
    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setUser(user);
    refreshToken.setToken(tokenValue);
    refreshToken.setExpiryDate(expiryDate);

    // Veritabanına kaydet
    RefreshToken savedToken = refreshTokenRepository.save(refreshToken);

    log.debug("Refresh token oluşturuldu: userId={}, expiryDate={}", user.getId(), expiryDate);

    return savedToken;
  }

  @Override
  public RefreshToken verifyExpiration(RefreshToken token) {
    // Token değişkene ata
    Instant expiryDate = token.getExpiryDate();

    // Guard Clause: Token süresi dolmuşsa erken dön
    if (expiryDate.isBefore(Instant.now())) {
      // Süresi dolmuş token'ı sil
      refreshTokenRepository.delete(token);

      log.warn("Refresh token süresi dolmuş: tokenId={}", token.getId());

      throw new BusinessException(Messages.REFRESH_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
    }

    return token;
  }

  @Override
  @Transactional
  public RefreshToken createOrRotate(User user) {
    // Kullanıcının mevcut tokenlarını soft delete yap
    refreshTokenRepository.deleteByUser(user);

    // Yeni token oluştur
    RefreshToken newToken = createRefreshToken(user);

    log.debug("Refresh token rotate edildi: userId={}", user.getId());

    return newToken;
  }

  @Override
  @Transactional
  @Scheduled(cron = "0 0 2 * * *")
  public void cleanupExpiredTokens() {
    try {
      Instant now = Instant.now();
      refreshTokenRepository.deleteByExpiryDateBefore(now);
      passwordResetTokenRepository.deleteByExpiryDateBefore(now);

    } catch (Exception e) {
      log.error("Expired token temizliği sırasında hata: {}", e.getMessage(), e);
    }
  }
}

