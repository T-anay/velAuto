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
public class ServiceCatalogResponseDto {

  private Integer id;

  private String name;

  private String description;

  private BigDecimal basePrice;


  private Integer createdBy;

  private LocalDateTime createdAt;

  private Integer updatedBy;

  private LocalDateTime updatedAt;
}


