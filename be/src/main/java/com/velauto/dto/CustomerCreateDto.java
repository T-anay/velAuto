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
public class CustomerCreateDto {

  // Ad ve Soyad zorunlulukları (NotBlank) kaldırıldı çünkü React'ten tek parça 'customer' geliyor.
  @Size(max = 100, message = "Ad maksimum 100 karakter olmalıdır")
  private String firstName;

  @Size(max = 100, message = "Soyad maksimum 100 karakter olmalıdır")
  private String lastName;

  // React'ten gelen tek parça isim verisini ("Ahmet Yılmaz") yakalamak için bu alanı ekledik
  private String customer;

  @NotBlank(message = "Telefon numarası boş bırakılamaz")
  @Pattern(regexp = "^[0-9\\s+()\\-]*[0-9][0-9\\s+()\\-]*$", message = "Telefon numarası geçersiz format")
  private String phone;

  // E-posta zorunluluğu ve desen (Pattern) kısıtlaması tamamen kaldırıldı
  private String email;

  // Commercial fields
  @Size(max = 500, message = "Adres maksimum 500 karakter olmalıdır")
  private String address;

  @Size(max = 50, message = "Vergi Numarası maksimum 50 karakter olmalıdır")
  private String taxNumber;

  @Size(max = 100, message = "Vergi Dairesi maksimum 100 karakter olmalıdır")
  private String taxOffice;

  @Size(max = 100, message = "Şirket adı maksimum 100 karakter olmalıdır")
  private String companyName;

  private String customerType; // INDIVIDUAL | CORPORATE (enum string)

  private java.math.BigDecimal discountRate;
}