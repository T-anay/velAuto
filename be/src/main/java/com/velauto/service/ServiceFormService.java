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
      Integer userId
  );

  ServiceFormResponseDto createDirectly(
      ServiceFormCreateDto request,
      Integer userId
  );

  ServiceFormResponseDto getServiceFormById(
      Integer serviceFormId,
      Integer userId
  );

  Page<ServiceFormResponseDto> getServiceFormsByTenant(
      Pageable pageable
  );

  Page<ServiceFormResponseDto> getServiceFormsByVehicle(
      Integer vehicleId,
      Pageable pageable
  );

  Page<ServiceFormResponseDto> getServiceFormsByCustomer(
      Integer customerId,
      Pageable pageable
  );

  ServiceFormResponseDto updateServiceForm(
      Integer serviceFormId,
      ServiceFormUpdateDto request,
      Integer userId
  );

  void deleteServiceForm(
      Integer serviceFormId,
      Integer userId
  );

  void completeServiceForm(
      Integer serviceFormId,
      Integer userId
  );
}
