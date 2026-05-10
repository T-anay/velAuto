package com.velauto.mapper;

import com.velauto.dto.ServiceFormCreateDto;
import com.velauto.dto.ServiceFormResponseDto;
import com.velauto.dto.ServiceFormUpdateDto;
import com.velauto.entity.ServiceForm;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ServiceFormMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "status", source = "status", defaultValue = "OPEN")
  @Mapping(target = "totalAmount", expression = "java(java.math.BigDecimal.ZERO)")
  @Mapping(target = "totalTax", expression = "java(java.math.BigDecimal.ZERO)")
  @Mapping(target = "complaints", source = "description")
  @Mapping(target = "isLocked", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  ServiceForm toServiceForm(ServiceFormCreateDto dto);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "appointmentId", ignore = true)
  @Mapping(target = "vehicleId", ignore = true)
  @Mapping(target = "customerId", ignore = true)
  @Mapping(target = "status", ignore = true)
  @Mapping(target = "totalAmount", ignore = true)
  @Mapping(target = "totalTax", ignore = true)
  @Mapping(target = "isLocked", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "complaints", ignore = true)
  void updateServiceForm(ServiceFormUpdateDto dto, @MappingTarget ServiceForm serviceForm);

  ServiceFormResponseDto toServiceFormResponseDto(ServiceForm serviceForm);
}
