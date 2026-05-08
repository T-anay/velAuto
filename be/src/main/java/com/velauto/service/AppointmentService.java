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
            Integer userId);

    AppointmentResponseDto getAppointmentById(
            Integer appointmentId,
            Integer userId);

    Page<AppointmentResponseDto> getAppointmentsByTenant(
            Pageable pageable);

    Page<AppointmentResponseDto> getAppointmentsByCustomer(
            Integer customerId,
            Pageable pageable);

    Page<AppointmentResponseDto> getAppointmentsByVehicle(
            Integer vehicleId,
            Pageable pageable);

    List<AppointmentResponseDto> getAppointmentsByDateRange(
            LocalDateTime startDate,
            LocalDateTime endDate);

    AppointmentResponseDto updateAppointment(
            Integer appointmentId,
            AppointmentUpdateDto request,
            Integer userId);

    void deleteAppointment(
            Integer appointmentId,
            Integer userId);

    com.velauto.dto.AppointmentResponseDto bookOnlineAppointment(
            com.velauto.dto.PublicAppointmentRequestDto request);

    AppointmentResponseDto reviseAppointment(
            Integer id,
            LocalDateTime newDate,
            String notes,
            Integer userId);
}
