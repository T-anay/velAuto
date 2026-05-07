package com.velauto.dto;

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
public class ServiceFormItemResponseDto {

  private Integer id;

  private Integer serviceFormId;

  private Integer serviceCatalogId;

  private Integer quantity;

  private BigDecimal unitPrice;

  private BigDecimal lineTotal;


  private Integer createdBy;

  private LocalDateTime createdAt;

  private Integer updatedBy;

  private LocalDateTime updatedAt;
}

