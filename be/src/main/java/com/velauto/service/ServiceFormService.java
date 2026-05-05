package com.velauto.service;

import com.velauto.dto.ServiceFormCreateDto;
import com.velauto.dto.ServiceFormResponseDto;
import com.velauto.dto.ServiceFormUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServiceFormService {

  ServiceFormResponseDto createFromAppointment(
      Integer appointmentId,
      ServiceFormCreateDto request,
      Integer tenantId,
      Integer userId
  );

  ServiceFormResponseDto createDirectly(
      ServiceFormCreateDto request,
      Integer tenantId,
      Integer userId
  );

  ServiceFormResponseDto getServiceFormById(
      Integer serviceFormId,
      Integer tenantId
  );

  Page<ServiceFormResponseDto> getServiceFormsByTenant(
      Integer tenantId,
      Pageable pageable
  );

  Page<ServiceFormResponseDto> getServiceFormsByVehicle(
      Integer vehicleId,
      Integer tenantId,
      Pageable pageable
  );

  Page<ServiceFormResponseDto> getServiceFormsByCustomer(
      Integer customerId,
      Integer tenantId,
      Pageable pageable
  );

  ServiceFormResponseDto updateServiceForm(
      Integer serviceFormId,
      ServiceFormUpdateDto request,
      Integer tenantId,
      Integer userId
  );

  void deleteServiceForm(
      Integer serviceFormId,
      Integer tenantId,
      Integer userId
  );

  void completeServiceForm(
      Integer serviceFormId,
      Integer tenantId,
      Integer userId
  );
}
