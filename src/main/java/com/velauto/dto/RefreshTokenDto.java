package com.velauto.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenDto {

  @NotBlank(message = "Refresh token boş bırakılamaz")
  private String refreshToken;
}


