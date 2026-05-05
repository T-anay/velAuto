package com.velauto.mapper;

import com.velauto.dto.AppointmentCreateDto;
import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.AppointmentUpdateDto;
import com.velauto.entity.Appointment;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface AppointmentMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "tenantId", ignore = true)
  @Mapping(target = "status", expression = "java(com.velauto.entity.enums.AppointmentStatus.PENDING)")
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  Appointment toAppointment(AppointmentCreateDto dto);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "customerId", ignore = true)
  @Mapping(target = "vehicleId", ignore = true)
  @Mapping(target = "tenantId", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  void updateAppointment(AppointmentUpdateDto dto, @MappingTarget Appointment appointment);

  AppointmentResponseDto toAppointmentResponseDto(Appointment appointment);
}
