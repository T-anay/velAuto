package com.velauto.dto;

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
public class StaffUpdateDto {

  @Size(min = 2, max = 100, message = "Ad soyad 2-100 karakter arasinda olmalidir")
  private String fullName;

  @Pattern(regexp = "^[0-9+]{10,20}$", message = "Telefon numarasi 10-20 haneli olmalidir")
  private String phone;

  private String role;

  private Boolean active;
}
