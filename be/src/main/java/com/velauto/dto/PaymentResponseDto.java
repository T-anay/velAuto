package com.velauto.dto;

import com.velauto.entity.enums.PaymentMethod;
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
public class PaymentResponseDto {

  private Integer id;

  private Integer serviceFormId;

  private BigDecimal amount;

  private PaymentMethod paymentMethod;

  private LocalDateTime paymentDate;


  private Integer createdBy;

  private LocalDateTime createdAt;
}

