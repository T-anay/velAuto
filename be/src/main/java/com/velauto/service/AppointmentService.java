package com.velauto.service;

import com.velauto.dto.AppointmentCreateDto;
import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.AppointmentUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentService {

  AppointmentResponseDto createAppointment(
      AppointmentCreateDto request,
      Integer tenantId,
      Integer userId
  );

  AppointmentResponseDto getAppointmentById(
      Integer appointmentId,
      Integer tenantId
  );

  Page<AppointmentResponseDto> getAppointmentsByTenant(
      Integer tenantId,
      Pageable pageable
  );

  Page<AppointmentResponseDto> getAppointmentsByCustomer(
      Integer customerId,
      Integer tenantId,
      Pageable pageable
  );

  Page<AppointmentResponseDto> getAppointmentsByVehicle(
      Integer vehicleId,
      Integer tenantId,
      Pageable pageable
  );

  List<AppointmentResponseDto> getAppointmentsByDateRange(
      Integer tenantId,
      LocalDateTime startDate,
      LocalDateTime endDate
  );

  AppointmentResponseDto updateAppointment(
      Integer appointmentId,
      AppointmentUpdateDto request,
      Integer tenantId,
      Integer userId
  );

  void deleteAppointment(
      Integer appointmentId,
      Integer tenantId,
      Integer userId
  );

  com.velauto.dto.AppointmentResponseDto bookOnlineAppointment(
      com.velauto.dto.PublicAppointmentRequestDto request,
      Integer tenantId
  );
}
