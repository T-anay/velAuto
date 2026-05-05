package com.velauto.service;

import com.velauto.dto.ServiceFormItemCreateDto;
import com.velauto.dto.ServiceFormItemResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServiceFormItemService {

  ServiceFormItemResponseDto addItemToForm(
      ServiceFormItemCreateDto request,
      Integer tenantId,
      Integer userId
  );

  ServiceFormItemResponseDto getItemById(
      Integer itemId,
      Integer tenantId
  );

  Page<ServiceFormItemResponseDto> getItemsByServiceForm(
      Integer serviceFormId,
      Integer tenantId,
      Pageable pageable
  );

  void deleteItem(
      Integer itemId,
      Integer tenantId,
      Integer userId
  );
}

