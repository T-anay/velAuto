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
public class ServiceFormCreateDto {

  private Integer appointmentId;

  @NotNull(message = Messages.SERVICE_FORM_VEHICLE_ID_REQUIRED)
  private Integer vehicleId;

  @NotNull(message = Messages.SERVICE_FORM_CUSTOMER_ID_REQUIRED)
  private Integer customerId;

  @NotNull(message = Messages.SERVICE_FORM_KM_REQUIRED)
  @Min(value = 0, message = Messages.SERVICE_FORM_KM_MIN)
  private Integer currentKm;

  @Size(max = 2000, message = Messages.SERVICE_FORM_COMPLAINTS_SIZE)
  private String complaints;

  @Size(max = 2000, message = Messages.SERVICE_FORM_CONDITION_SIZE)
  private String generalCondition;
}
