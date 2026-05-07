package com.velauto.mapper;

import com.velauto.dto.PaymentCreateDto;
import com.velauto.dto.PaymentResponseDto;
import com.velauto.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "paymentDate", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  Payment toPayment(PaymentCreateDto dto);

  PaymentResponseDto toResponseDto(Payment entity);
}

