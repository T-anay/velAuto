package com.velauto.dto;

import com.velauto.entity.enums.ExpenseCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseUpdateDto {

  @DecimalMin(value = "0.01", message = "Gider tutarı 0.01'den az olamaz.")
  @Digits(integer = 8, fraction = 2, message = "Gider tutarı maksimum 8 rakam ve 2 ondalık basamak olmalıdır.")
  private BigDecimal amount;

  @PastOrPresent(message = "Gider tarihi gelecekte olamaz.")
  private LocalDate expenseDate;

  private ExpenseCategory category;

  @Size(max = 500, message = "Açıklama maksimum 500 karakter olmalıdır.")
  private String description;
}

