package com.velauto.mapper;

import com.velauto.dto.AuthResponseDto;
import com.velauto.entity.RefreshToken;
import com.velauto.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuthMapper {

  /**
   * User ve token bilgilerinden AuthResponseDto oluşturur
   * @param user User entity
   * @param accessToken JWT access token
   * @param refreshToken RefreshToken entity
   * @return AuthResponseDto DTO
   */
  @Mapping(target = "accessToken", source = "accessToken")
  @Mapping(target = "refreshToken", source = "refreshToken.token")
  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "email", source = "user.email")
  @Mapping(target = "role", source = "user.role")
  @Mapping(target = "tenantId", source = "user.tenantId")
  @Mapping(target = "tokenType", constant = "Bearer")
  AuthResponseDto toAuthResponse(User user, String accessToken, RefreshToken refreshToken);

  /**
   * User ve sadece access token ile AuthResponseDto oluşturur (refresh token yenileme için)
   * @param user User entity
   * @param accessToken JWT access token
   * @param refreshTokenValue Refresh token string
   * @return AuthResponseDto DTO
   */
  @Mapping(target = "accessToken", source = "accessToken")
  @Mapping(target = "refreshToken", source = "refreshTokenValue")
  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "email", source = "user.email")
  @Mapping(target = "role", source = "user.role")
  @Mapping(target = "tenantId", source = "user.tenantId")
  @Mapping(target = "tokenType", constant = "Bearer")
  AuthResponseDto toAuthResponse(User user, String accessToken, String refreshTokenValue);
}


