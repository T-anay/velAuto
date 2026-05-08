package com.velauto.dto;

import com.velauto.entity.enums.ServiceFormItemStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceFormItemStatusUpdateDto {

  @NotNull(message = "Kalem statusu zorunludur")
  private ServiceFormItemStatus status;
}
