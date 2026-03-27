package com.velauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponseDto {

  private Integer id;

  private String licensePlate;

  private Integer year;

  private String chassisNumber;

  private String color;

  private Integer odometer;

  // Customer bilgisi (opsiyonel)
  private Integer customerId;
  private String customerFullName;

  // Staff assignment (opsiyonel)
  private Integer assignedStaffId;
  private String assignedStaffName;

  // Metadata
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  // Marka ve Model bilgileri
  private Integer brandId;
  private String brandName;
  private Integer modelId;
  private String modelName;
}


