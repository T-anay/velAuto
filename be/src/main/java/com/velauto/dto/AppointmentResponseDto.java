package com.velauto.dto;

import com.velauto.entity.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponseDto {

  private Integer id;

  private Integer customerId;

  private Integer vehicleId;

  private LocalDateTime appointmentDate;

  private AppointmentStatus status;

  private String notes;


  private Integer createdBy;

  private LocalDateTime createdAt;

  private Integer updatedBy;

  private LocalDateTime updatedAt;
}

