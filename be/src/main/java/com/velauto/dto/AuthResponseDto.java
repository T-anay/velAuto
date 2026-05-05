package com.velauto.dto;

import com.velauto.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {

  private String accessToken;

  private String refreshToken;

  private Integer userId;

  private String email;

  private Role role;

  private Integer tenantId;

  @Builder.Default
  private String tokenType = "Bearer";
}


