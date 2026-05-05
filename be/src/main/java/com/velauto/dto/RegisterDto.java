package com.velauto.dto;

import com.velauto.validation.ValidPassword;
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
public class RegisterDto {

  @NotBlank(message = "E-posta adresi boş bırakılamaz")
  @Email(message = "Geçerli bir e-posta adresi giriniz")
  private String email;

  @NotBlank(message = "Şifre boş bırakılamaz")
  @ValidPassword
  private String password;

  @NotBlank(message = "Şifre tekrarı boş bırakılamaz")
  private String confirmPassword;

  @NotBlank(message = "Ad soyad boş bırakılamaz")
  @Size(min = 2, max = 100, message = "Ad soyad 2-100 karakter arasında olmalıdır")
  private String fullName;

  @NotBlank(message = "Telefon numarası boş bırakılamaz")
  @Pattern(regexp = "^[0-9]{10}$", message = "Telefon numarası 10 haneli olmalıdır")
  private String phone;

  private String address;

  private String companyName;
}


