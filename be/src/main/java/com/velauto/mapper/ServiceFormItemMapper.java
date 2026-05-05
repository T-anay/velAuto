package com.velauto.mapper;

import com.velauto.dto.ServiceFormItemCreateDto;
import com.velauto.dto.ServiceFormItemResponseDto;
import com.velauto.entity.ServiceFormItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ServiceFormItemMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "tenantId", ignore = true)
  @Mapping(target = "itemName", ignore = true)
  @Mapping(target = "unitPrice", ignore = true)
  @Mapping(target = "taxRate", ignore = true)
  @Mapping(target = "lineTotal", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  ServiceFormItem toServiceFormItem(ServiceFormItemCreateDto dto);

  ServiceFormItemResponseDto toResponseDto(ServiceFormItem entity);
}

