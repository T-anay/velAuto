package com.velauto.dto;

import com.velauto.entity.enums.AppointmentStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentUpdateDto {

  @FutureOrPresent(message = "Randevu tarihi gelecekte olmalıdır")
  private LocalDateTime appointmentDate;

  private AppointmentStatus status;

  @Size(max = 1000, message = "Notlar 1000 karakterden fazla olamaz")
  private String notes;
}

