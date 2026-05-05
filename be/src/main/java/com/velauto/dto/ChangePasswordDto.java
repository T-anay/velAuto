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
public class ChangePasswordDto {

  @NotBlank(message = "Mevcut siifre bos birakilamaz")
  private String oldPassword;

  @NotBlank(message = "Yeni sifre bos birakilamaz")
  @ValidPassword
  private String newPassword;

  @NotBlank(message = "Yeni sifre tekrari bos birakilamaz")
  private String newPasswordConfirm;
}




