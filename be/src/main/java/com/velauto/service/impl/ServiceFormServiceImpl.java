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
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (appointmentId == null || request == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch appointment - No Optional chaining
    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }
    Appointment appointment = appointmentOptional.get();

    // Guard Clause: Appointment already has a service form?
    Optional<ServiceForm> existingFormOptional = serviceFormRepository.findByAppointmentIdAndTenantId(appointmentId, tenantId);
    if (existingFormOptional.isPresent()) {
      throw new BusinessException(Messages.SERVICE_FORM_ALREADY_EXISTS_FOR_APPOINTMENT);
    }

    // Fetch vehicle - No Optional chaining
    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(request.getVehicleId());
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }
    Vehicle vehicle = vehicleOptional.get();

    // Guard Clause: Vehicle deleted?
    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException(Messages.VEHICLE_DELETED);
    }

    // Fetch customer - No Optional chaining
    Optional<Customer> customerOptional = customerRepository.findById(request.getCustomerId());
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }
    Customer customer = customerOptional.get();

    // Guard Clause: Customer deleted?
    if (customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_DELETED);
    }

    // Guard Clause: Customer belongs to tenant?
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId == null || !customerTenantId.equals(tenantId)) {
      throw new BusinessException(Messages.UNAUTHORIZED_ACCESS);
    }

    // Guard Clause: currentKm validation - must not be less than vehicle's last odometer
    Integer lastOdometer = vehicle.getOdometer() != null ? vehicle.getOdometer() : 0;
    if (request.getCurrentKm() < lastOdometer) {
      throw new BusinessException(Messages.SERVICE_FORM_KM_INVALID);
    }

    // Map DTO to Entity
    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setAppointmentId(appointmentId);
    serviceForm.setTenantId(tenantId);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());

    // Save service form
    ServiceForm savedForm = serviceFormRepository.save(serviceForm);

    // Audit log - Single responsibility per line
    String auditDetails = String.format(
        "Randevudan servis formu oluşturuldu: appointmentID=%d, vehicleID=%d, currentKm=%d, complaints=%s",
        appointmentId,
        request.getVehicleId(),
        request.getCurrentKm(),
        request.getComplaints()
    );
    auditLogService.log(userId, "SERVICE_FORM_CREATED_FROM_APPOINTMENT", "SERVICE_FORM", savedForm.getId(), auditDetails);

    return serviceFormMapper.toServiceFormResponseDto(savedForm);
  }

  @Override
  public ServiceFormResponseDto createDirectly(
      ServiceFormCreateDto request,
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (request == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch vehicle - No Optional chaining
    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(request.getVehicleId());
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }
    Vehicle vehicle = vehicleOptional.get();

    // Guard Clause: Vehicle deleted?
    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException(Messages.VEHICLE_DELETED);
    }

    // Fetch customer - No Optional chaining
    Optional<Customer> customerOptional = customerRepository.findById(request.getCustomerId());
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }
    Customer customer = customerOptional.get();

    // Guard Clause: Customer deleted?
    if (customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_DELETED);
    }

    // Guard Clause: Customer belongs to tenant?
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId == null || !customerTenantId.equals(tenantId)) {
      throw new BusinessException(Messages.UNAUTHORIZED_ACCESS);
    }

    // Guard Clause: currentKm validation
    Integer lastOdometer = vehicle.getOdometer() != null ? vehicle.getOdometer() : 0;
    if (request.getCurrentKm() < lastOdometer) {
      throw new BusinessException(Messages.SERVICE_FORM_KM_INVALID);
    }

    // Map DTO to Entity
    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setTenantId(tenantId);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());

    // Save service form
    ServiceForm savedForm = serviceFormRepository.save(serviceForm);

    // Audit log
    String auditDetails = String.format(
        "Doğrudan servis formu oluşturuldu: vehicleID=%d, currentKm=%d, complaints=%s",
        request.getVehicleId(),
        request.getCurrentKm(),
        request.getComplaints()
    );
    auditLogService.log(userId, "SERVICE_FORM_CREATED_DIRECTLY", "SERVICE_FORM", savedForm.getId(), auditDetails);

    return serviceFormMapper.toServiceFormResponseDto(savedForm);
  }

  @Override
  @Transactional(readOnly = true)
  public ServiceFormResponseDto getServiceFormById(
      Integer serviceFormId,
      Integer tenantId
  ) {
    // Guard Clause: Validate input
    if (serviceFormId == null || tenantId == null) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    // Fetch service form - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(serviceFormId, tenantId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();
    return serviceFormMapper.toServiceFormResponseDto(serviceForm);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByTenant(
      Integer tenantId,
      Pageable pageable
  ) {
    // Guard Clause: Validate input
    if (tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByTenantId(tenantId, pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByVehicle(
      Integer vehicleId,
      Integer tenantId,
      Pageable pageable
  ) {
    // Guard Clause: Validate input
    if (vehicleId == null || tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch vehicle - No Optional chaining
    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(vehicleId);
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByVehicleIdAndTenantId(vehicleId, tenantId, pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormResponseDto> getServiceFormsByCustomer(
      Integer customerId,
      Integer tenantId,
      Pageable pageable
  ) {
    // Guard Clause: Validate input
    if (customerId == null || tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch customer - No Optional chaining
    Optional<Customer> customerOptional = customerRepository.findById(customerId);
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Page<ServiceForm> serviceForms = serviceFormRepository.findByCustomerIdAndTenantId(customerId, tenantId, pageable);
    return serviceForms.map(serviceFormMapper::toServiceFormResponseDto);
  }

  @Override
  public ServiceFormResponseDto updateServiceForm(
      Integer serviceFormId,
      ServiceFormUpdateDto request,
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (serviceFormId == null || request == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch service form - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(serviceFormId, tenantId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    // Guard Clause: Service form is locked?
    if (serviceForm.getIsLocked() != null && serviceForm.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }

    // Guard Clause: Service form deleted?
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    // Guard Clause: currentKm validation if provided
    if (request.getCurrentKm() != null) {
      Integer lastOdometer = serviceForm.getVehicleId() != null ? vehicleRepository.findById(serviceForm.getVehicleId()).map(v -> v.getOdometer() != null ? v.getOdometer() : 0).orElse(0) : 0;
      if (request.getCurrentKm() < lastOdometer) {
        throw new BusinessException(Messages.SERVICE_FORM_KM_INVALID);
      }
    }

    // Store old values for audit
    Integer oldKm = serviceForm.getCurrentKm();

    // Update service form
    serviceFormMapper.updateServiceForm(request, serviceForm);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    ServiceForm updatedForm = serviceFormRepository.save(serviceForm);

    // Audit log
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
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (serviceFormId == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch service form - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(serviceFormId, tenantId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    // Guard Clause: Already deleted?
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_ALREADY_DELETED);
    }

    // Soft delete
    LocalDateTime now = LocalDateTime.now();
    serviceForm.setDeletedAt(now);
    serviceForm.setDeletedBy(userId);

    serviceFormRepository.save(serviceForm);

    // Audit log
    String auditDetails = String.format(
        "Servis formu silindi (soft delete): ID=%d, status=%s",
        serviceForm.getId(),
        serviceForm.getStatus()
    );
    auditLogService.log(userId, "SERVICE_FORM_DELETED", "SERVICE_FORM", serviceFormId, auditDetails);
  }

  @Override
  @Transactional
  public void completeServiceForm(Integer serviceFormId, Integer tenantId, Integer userId) {
    // Guard Clause: Validate input
    if (serviceFormId == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch service form - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(serviceFormId, tenantId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();

    // Guard Clause: Form already completed?
    if (serviceForm.getStatus() == com.velauto.entity.enums.ServiceFormStatus.COMPLETED) {
      throw new BusinessException("Servis formu zaten kapatildi", org.springframework.http.HttpStatus.CONFLICT);
    }

    // Guard Clause: Form deleted?
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    // Update status to COMPLETED
    serviceForm.setStatus(com.velauto.entity.enums.ServiceFormStatus.COMPLETED);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    serviceFormRepository.save(serviceForm);

    // Audit log
    String auditDetails = String.format(
        "Servis formu kapatildi (completed): ID=%d, totalAmount=%s, totalTax=%s",
        serviceFormId,
        serviceForm.getTotalAmount(),
        serviceForm.getTotalTax()
    );
    auditLogService.log(userId, "SERVICE_FORM_COMPLETED", "SERVICE_FORM", serviceFormId, auditDetails);
  }
}

