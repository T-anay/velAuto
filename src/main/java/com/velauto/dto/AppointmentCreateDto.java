package com.velauto.dto;

import com.velauto.constant.Messages;
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
public class AppointmentCreateDto {

  @NotNull(message = Messages.APPOINTMENT_CUSTOMER_ID_REQUIRED)
  private Integer customerId;

  @NotNull(message = Messages.APPOINTMENT_VEHICLE_ID_REQUIRED)
  private Integer vehicleId;

  @NotNull(message = Messages.APPOINTMENT_DATE_REQUIRED)
  @FutureOrPresent(message = Messages.APPOINTMENT_DATE_INVALID)
  private LocalDateTime appointmentDate;

  @Size(max = 1000, message = Messages.APPOINTMENT_NOTES_SIZE)
  private String notes;
}
