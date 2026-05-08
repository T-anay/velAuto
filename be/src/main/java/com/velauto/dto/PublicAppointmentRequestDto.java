package com.velauto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicAppointmentRequestDto {

  @NotBlank(message = "Telefon numarasi bos birakilamaz")
  @Pattern(regexp = "^[\\d\\s+()\\-]*\\d[\\d\\s+()\\-]*$", message = "Telefon numarasi gecersiz format")
  private String phone;

  @NotBlank(message = "E-posta bos birakilamaz")
  @jakarta.validation.constraints.Email(message = "E-posta gecersiz format")
  private String email;

  @NotBlank(message = "Ad bos birakilamaz")
  @Size(min = 2, max = 100, message = "Ad 2-100 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Zçğıöşü'\\s-]+$", message = "Ad gecersiz karakter iceriyor")
  private String firstName;

  @NotBlank(message = "Soyad bos birakilamaz")
  @Size(min = 2, max = 100, message = "Soyad 2-100 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Zçğıöşü'\\s-]+$", message = "Soyad gecersiz karakter iceriyor")
  private String lastName;

  @NotBlank(message = "Arac plakasi bos birakilamaz")
  @Pattern(regexp = "^[0-9A-Za-z\\s-]{5,11}$", message = "Plaka gecersiz format")
  private String plate;

  @NotBlank(message = "Arac markasi bos birakilamaz")
  @Size(min = 2, max = 50, message = "Marka 2-50 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Zçğıöşü\\s-]+$", message = "Marka gecersiz karakter iceriyor")
  private String brand;

  @NotBlank(message = "Arac modeli bos birakilamaz")
  @Size(min = 2, max = 50, message = "Model 2-50 karakter arasinda olmalidir")
  @Pattern(regexp = "^[a-zA-Z0-9çğıöşü\\s-]+$", message = "Model gecersiz karakter iceriyor")
  private String model;

  @NotBlank(message = "Sikayet/Ariza aciklamasi bos birakilamaz")
  @Size(min = 10, max = 1000, message = "Sikayet 10-1000 karakter arasinda olmalidir")
  private String complaint;

  @jakarta.validation.constraints.NotNull(message = "Randevu tarihi bos birakilamaz")
  private LocalDateTime appointmentDate;

  private MultipartFile damageImage;
}
