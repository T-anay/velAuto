package com.velauto.service;

import com.velauto.entity.RefreshToken;
import com.velauto.entity.User;

public interface RefreshTokenService {

  RefreshToken createRefreshToken(User user);

  RefreshToken verifyExpiration(RefreshToken token);

  RefreshToken createOrRotate(User user);

  void cleanupExpiredTokens();
}

