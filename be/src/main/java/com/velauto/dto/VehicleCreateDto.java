package com.velauto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCreateDto {

  @NotBlank(message = "Plaka zorunludur")
  @Size(max = 20, message = "Plaka en fazla 20 karakter olabilir")
  private String licensePlate;

  // Müşteriyi araca bağlamak için gerekli
  private Long customerId;

  @Size(max = 50, message = "Marka en fazla 50 karakter olabilir")
  private String brand;

  // Model opsiyonel - "Diğer" seçilirse model alanı boş olabilir
  private String model;
}