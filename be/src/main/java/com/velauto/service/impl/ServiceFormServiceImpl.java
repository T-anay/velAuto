package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.ServiceFormCreateDto;
import com.velauto.dto.ServiceFormResponseDto;
import com.velauto.dto.ServiceFormUpdateDto;
import com.velauto.entity.Appointment;
import com.velauto.entity.Customer;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.Vehicle;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.ServiceFormMapper;
import com.velauto.repository.AppointmentRepository;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.ServiceFormRepository;
import com.velauto.repository.VehicleRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.ServiceFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceFormServiceImpl implements ServiceFormService {

  private final ServiceFormRepository serviceFormRepository;
  private final CustomerRepository customerRepository;
  private final VehicleRepository vehicleRepository;
  private final AppointmentRepository appointmentRepository;
  private final ServiceFormMapper serviceFormMapper;
  private final AuditLogService auditLogService;

  @Override
  public ServiceFormResponseDto createFromAppointment(
          Integer appointmentId,
          ServiceFormCreateDto request,
          Integer userId
  ) {
    if (appointmentId == null || request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndDeletedAtIsNull(appointmentId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Optional<ServiceForm> existingFormOptional = serviceFormRepository.findByAppointmentIdAndDeletedAtIsNull(appointmentId);
    if (existingFormOptional.isPresent()) {
      throw new BusinessException(Messages.SERVICE_FORM_ALREADY_EXISTS_FOR_APPOINTMENT);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(request.getVehicleId());
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }
    Vehicle vehicle = vehicleOptional.get();

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException(Messages.VEHICLE_DELETED);
    }

    // Customer doğrulamasını atlıyoruz (çünkü DTO'dan zorunluluğunu kaldırdık, araç üzerinden buluyoruz)
    Customer customer = vehicle.getCustomer();
    if (customer == null || customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    // KM doğrulamasını atlıyoruz veya güvenli hale getiriyoruz
    Integer incomingKm = request.getCurrentKm() != null ? request.getCurrentKm() : 0;
    Integer lastOdometer = vehicle.getOdometer() != null ? vehicle.getOdometer() : 0;

    // YALNIZCA GİREN KM MEVCUT KM'DEN KÜÇÜKSE HATA VER (Ama biz 0 kabul edip geçiyoruz)
    if (incomingKm > 0 && incomingKm < lastOdometer) {
      // throw new BusinessException(Messages.SERVICE_FORM_KM_INVALID); // (İstersen aktif edersin)
    }

    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setAppointmentId(appointmentId);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());

    // Müşteriyi araçtan alıp forma atıyoruz
    serviceForm.setCustomerId(customer.getId());

    ServiceForm savedForm = serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Randevudan servis formu oluşturuldu: appointmentID=%d, vehicleID=%d, currentKm=%d, description=%s",
            appointmentId,
            request.getVehicleId(),
            incomingKm,
            request.getDescription() // complaints yerine description
    );
    auditLogService.log(userId, "SERVICE_FORM_CREATED_FROM_APPOINTMENT", "SERVICE_FORM", savedForm.getId(), auditDetails);

    return serviceFormMapper.toServiceFormResponseDto(savedForm);
  }

  @Override
  public ServiceFormResponseDto createDirectly(
          ServiceFormCreateDto request,
          Integer userId
  ) {
    if (request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(request.getVehicleId());
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }
    Vehicle vehicle = vehicleOptional.get();

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException(Messages.VEHICLE_DELETED);
    }

    // Customer doğrulamasını atlıyoruz, araç üzerinden alıyoruz
    Customer customer = vehicle.getCustomer();
    if (customer == null || customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Integer incomingKm = request.getCurrentKm() != null ? request.getCurrentKm() : 0;

    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());

    // Müşteriyi araçtan alıp forma atıyoruz
    serviceForm.setCustomerId(customer.getId());

    ServiceForm savedForm = serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Doğrudan servis formu oluşturuldu: vehicleID=%d, currentKm=%d, description=%s",
            request.getVehicleId(),
            incomingKm,
            request.getDescription() // complaints yerine description
    );
    auditLogService.log(userId, "SERVICE_FORM_CREATED_DIRECTLY", "SERVICE_FORM", savedForm.getId(), auditDetails);

    return serviceFormMapper.toServiceFormResponseDto(savedForm);
  }

  @Override
  @Transactional(readOnly = true)
  public ServiceFormResponseDto getServiceFormById(
          Integer serviceFormId,
          Integer userId
    ) {
    if (serviceFormId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();
    return serviceFormMapper.toServiceFormResponseDto(serviceForm);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByTenant(
          Pageable pageable
  ) {
    if (pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByDeletedAtIsNull(pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByVehicle(
          Integer vehicleId,
          Pageable pageable
  ) {
    if (vehicleId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(vehicleId);
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByVehicleIdAndDeletedAtIsNull(vehicleId, pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByCustomer(
          Integer customerId,
          Pageable pageable
  ) {
    if (customerId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Customer> customerOptional = customerRepository.findByIdAndDeletedAtIsNull(customerId);
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByCustomerIdAndDeletedAtIsNull(customerId, pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  public ServiceFormResponseDto updateServiceForm(
          Integer serviceFormId,
          ServiceFormUpdateDto request,
          Integer userId
    ) {
    if (serviceFormId == null || request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    if (serviceForm.getIsLocked() != null && serviceForm.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }

    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    Integer oldKm = serviceForm.getCurrentKm();

    serviceFormMapper.updateServiceForm(request, serviceForm);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    ServiceForm updatedForm = serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Servis formu güncellendi: km=%d→%d, complaints=%s",
            oldKm,
            updatedForm.getCurrentKm(),
            updatedForm.getComplaints()
    );
    auditLogService.log(userId, "SERVICE_FORM_UPDATED", "SERVICE_FORM", updatedForm.getId(), auditDetails);

    return serviceFormMapper.toServiceFormResponseDto(updatedForm);
  }

  @Override
  public void deleteServiceForm(
          Integer serviceFormId,
          Integer userId
  ) {
    if (serviceFormId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_ALREADY_DELETED);
    }

    LocalDateTime now = LocalDateTime.now();
    serviceForm.setDeletedAt(now);
    serviceForm.setDeletedBy(userId);

    serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Servis formu silindi (soft delete): ID=%d, status=%s",
            serviceForm.getId(),
            serviceForm.getStatus()
    );
    auditLogService.log(userId, "SERVICE_FORM_DELETED", "SERVICE_FORM", serviceFormId, auditDetails);
  }

  @Override
  @Transactional
  public void completeServiceForm(Integer serviceFormId, Integer userId) {
    if (serviceFormId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    if (serviceForm.getStatus() == com.velauto.entity.enums.ServiceFormStatus.COMPLETED) {
      throw new BusinessException("Servis formu zaten kapatildi", org.springframework.http.HttpStatus.CONFLICT);
    }

    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    serviceForm.setStatus(com.velauto.entity.enums.ServiceFormStatus.COMPLETED);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Servis formu kapatildi (completed): ID=%d, totalAmount=%s, totalTax=%s",
            serviceFormId,
            serviceForm.getTotalAmount(),
            serviceForm.getTotalTax()
    );
    auditLogService.log(userId, "SERVICE_FORM_COMPLETED", "SERVICE_FORM", serviceFormId, auditDetails);
  }
}