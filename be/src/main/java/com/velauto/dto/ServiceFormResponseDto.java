package com.velauto.dto;

import com.velauto.entity.enums.ServiceFormStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceFormResponseDto {

  private Integer id;

  private Integer appointmentId;

  private Integer vehicleId;

  private Integer customerId;

  private Integer assignedStaffId;

  private Integer currentKm;

  private String complaints;

  private String generalCondition;

  private ServiceFormStatus status;

  private BigDecimal totalAmount;


  private Integer createdBy;

  private LocalDateTime createdAt;

  private Integer updatedBy;

  private LocalDateTime updatedAt;
}

