package com.velauto.dto;

import com.velauto.constant.Messages;
import com.velauto.entity.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCreateDto {

  @NotNull(message = Messages.PAYMENT_SERVICE_FORM_ID_REQUIRED)
  private Integer serviceFormId;

  @NotNull(message = Messages.PAYMENT_AMOUNT_REQUIRED)
  @DecimalMin(value = "0.01", message = Messages.PAYMENT_AMOUNT_INVALID)
  @Digits(integer = 8, fraction = 2, message = Messages.PAYMENT_AMOUNT_DIGITS)
  private BigDecimal amount;

  @NotNull(message = Messages.PAYMENT_METHOD_REQUIRED)
  private PaymentMethod paymentMethod;
}

