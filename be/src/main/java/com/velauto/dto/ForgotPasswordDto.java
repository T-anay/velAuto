package com.velauto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordDto {

  @NotBlank(message = "E-posta adresi boş bırakılamaz")
  @Email(message = "Geçerli bir e-posta adresi giriniz")
  private String email;
}


