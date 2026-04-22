package com.velauto.dto;

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
public class UserProfileUpdateDto {

  @NotBlank(message = "Ad bos birakilamaz")
  @Size(min = 2, max = 100, message = "Ad 2-100 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Zçğıöşüaeilnrt\\'\\s-]+$", message = "Ad gecersiz karakter iceriyor")
  private String firstName;

  @NotBlank(message = "Soyad bos birakilamaz")
  @Size(min = 2, max = 100, message = "Soyad 2-100 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Zçğıöşüaeilnrt\\'\\s-]+$", message = "Soyad gecersiz karakter iceriyor")
  private String lastName;

  @NotBlank(message = "Telefon numarasi bos birakilamaz")
  @Pattern(regexp = "^[0-9\\s+()\\-]*[0-9][0-9\\s+()\\-]*$", message = "Telefon numarasi gecersiz format")
  private String phone;
}

