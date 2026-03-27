package com.velauto.dto;

import com.velauto.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordDto {

  @NotBlank(message = "Token boş bırakılamaz")
  private String token;

  @NotBlank(message = "Yeni şifre boş bırakılamaz")
  @ValidPassword
  private String newPassword;

  @NotBlank(message = "Yeni şifre tekrarı boş bırakılamaz")
  private String confirmNewPassword;
}


