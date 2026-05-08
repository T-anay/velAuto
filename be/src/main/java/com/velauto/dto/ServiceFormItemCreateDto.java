package com.velauto.dto;

import com.velauto.constant.Messages;
import com.velauto.entity.enums.ServiceFormItemStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceFormItemCreateDto {

  @NotNull(message = Messages.SERVICE_FORM_ITEM_SERVICE_FORM_ID_REQUIRED)
  private Integer serviceFormId;

  @NotNull(message = Messages.SERVICE_FORM_ITEM_SERVICE_CATALOG_ID_REQUIRED)
  private Integer serviceCatalogId;

  @NotNull(message = Messages.SERVICE_FORM_ITEM_QUANTITY_REQUIRED)
  @Min(value = 1, message = Messages.SERVICE_FORM_ITEM_QUANTITY_MIN)
  @Max(value = 1000, message = Messages.SERVICE_FORM_ITEM_QUANTITY_MAX)
  private Integer quantity;

  private ServiceFormItemStatus status;
}

