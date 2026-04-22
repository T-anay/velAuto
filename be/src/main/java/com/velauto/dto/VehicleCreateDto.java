package com.velauto.dto;

import com.velauto.constant.Messages;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCreateDto {

  @NotBlank(message = Messages.VEHICLE_LICENSE_PLATE_REQUIRED)
  @Size(max = 20, message = Messages.VEHICLE_LICENSE_PLATE_SIZE)
  private String licensePlate;

  // Opsiyonel: Araç oluştururken müşteri seçilmeyebilir, sonradan eklenebilir
  @Positive(message = Messages.VEHICLE_CUSTOMER_ID_POSITIVE)
  private Integer customerId;

  @NotNull(message = Messages.VEHICLE_BRAND_ID_REQUIRED)
  @Positive(message = Messages.VEHICLE_BRAND_ID_POSITIVE)
  private Integer brandId;

  @NotNull(message = Messages.VEHICLE_MODEL_ID_REQUIRED)
  @Positive(message = Messages.VEHICLE_MODEL_ID_POSITIVE)
  private Integer modelId;

  @Min(value = 1900, message = Messages.VEHICLE_YEAR_MIN)
  @Max(value = 2100, message = Messages.VEHICLE_YEAR_MAX)
  private Integer year;

  @Size(max = 50, message = Messages.VEHICLE_CHASSIS_NUMBER_SIZE)
  private String chassisNumber;

  @Size(max = 30, message = Messages.VEHICLE_COLOR_SIZE)
  private String color;

  @Min(value = 0, message = Messages.VEHICLE_ODOMETER_MIN)
  private Integer odometer;
}
