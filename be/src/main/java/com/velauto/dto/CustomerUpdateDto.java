package com.velauto.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerUpdateDto {

  @Size(min = 2, max = 100, message = "Ad 2-100 karakter arasında olmalıdır")
  @Pattern(regexp = "^[a-zA-ZçğıöşüÇĞİÖŞÜ\\s'-]*$", message = "Ad sadece harf, boşluk, tire ve apostrof içerebilir")
  private String firstName;

  @Size(min = 2, max = 100, message = "Soyad 2-100 karakter arasında olmalıdır")
  @Pattern(regexp = "^[a-zA-ZçğıöşüÇĞİÖŞÜ\\s'-]*$", message = "Soyad sadece harf, boşluk, tire ve apostrof içerebilir")
  private String lastName;

  @Pattern(regexp = "^[0-9\\s+()\\-]*[0-9][0-9\\s+()\\-]*$", message = "Telefon numarası geçersiz format")
  private String phone;

  @Size(max = 500, message = "Adres maksimum 500 karakter olmalıdır")
  private String address;

  @Size(max = 50, message = "Vergi Numarası maksimum 50 karakter olmalıdır")
  private String taxNumber;

  @Size(max = 100, message = "Vergi Dairesi maksimum 100 karakter olmalıdır")
  private String taxOffice;

  @Size(max = 100, message = "Şirket adı maksimum 100 karakter olmalıdır")
  private String companyName;

  private String customerType; // INDIVIDUAL | CORPORATE

  private BigDecimal discountRate;
}


