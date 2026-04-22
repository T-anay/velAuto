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
public class InvoiceResponseDto {

  private Integer id;
  private String invoiceNumber;
  private LocalDateTime issueDate;
  private BigDecimal totalAmount;
  private BigDecimal totalTax;
  private String pdfUrl;
}

