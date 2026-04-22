package com.velauto.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignStaffDto {

  @Positive(message = "Staff ID pozitif bir sayı olmalıdır")
  private Integer staffId;
}


