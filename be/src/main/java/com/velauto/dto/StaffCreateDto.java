package com.velauto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffCreateDto {

  @NotBlank(message = "E-posta adresi bos birakilamaz")
  @Email(message = "Gecerli bir e-posta adresi giriniz")
  private String email;

  private String password;

  private String role;

  @NotBlank(message = "Ad soyad bos birakilamaz")
  @Size(min = 2, max = 100, message = "Ad soyad 2-100 karakter arasinda olmalidir")
  private String fullName;

  @Pattern(regexp = "^[0-9+]{10,20}$", message = "Telefon numarasi 10-20 haneli olmalidir")
  private String phone;
}
