package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.ServiceFormCreateDto;
import com.velauto.dto.ServiceFormResponseDto;
import com.velauto.dto.ServiceFormUpdateDto;
import com.velauto.entity.Appointment;
import com.velauto.entity.Customer;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.ServiceFormItem;
import com.velauto.entity.Staff;
import com.velauto.entity.Vehicle;
import com.velauto.entity.enums.AppointmentStatus;
import com.velauto.entity.enums.ServiceFormItemStatus;
import com.velauto.entity.enums.ServiceFormStatus;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.ServiceFormItemMapper;
import com.velauto.mapper.ServiceFormMapper;
import com.velauto.repository.AppointmentRepository;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.ServiceFormItemRepository;
import com.velauto.repository.ServiceFormRepository;
import com.velauto.repository.StaffRepository;
import com.velauto.repository.VehicleRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.ServiceFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceFormServiceImpl implements ServiceFormService {

  private final ServiceFormRepository serviceFormRepository;
  private final CustomerRepository customerRepository;
  private final VehicleRepository vehicleRepository;
  private final AppointmentRepository appointmentRepository;
  private final ServiceFormItemRepository serviceFormItemRepository;
  private final StaffRepository staffRepository;
  private final ServiceFormMapper serviceFormMapper;
  private final ServiceFormItemMapper serviceFormItemMapper;
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

    Customer customer = vehicle.getCustomer();
    if (customer == null || customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Integer incomingKm = request.getCurrentKm() != null ? request.getCurrentKm() : 0;

    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setAppointmentId(appointmentId);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());
    serviceForm.setCustomerId(customer.getId());

    ServiceForm savedForm = serviceFormRepository.save(serviceForm);
    
    // Randevu durumunu GÜNCELLE
    Appointment appointment = appointmentOptional.get();
    appointment.setStatus(AppointmentStatus.CONVERTED);
    appointment.setUpdatedAt(LocalDateTime.now());
    appointmentRepository.save(appointment);

    String auditDetails = String.format(
            "Randevudan servis formu oluşturuldu: appointmentID=%d, vehicleID=%d, currentKm=%d",
            appointmentId, request.getVehicleId(), incomingKm
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

    Customer customer = vehicle.getCustomer();
    if (customer == null || customer.getDeletedAt() != null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormMapper.toServiceForm(request);
    serviceForm.setCreatedBy(userId);
    serviceForm.setCreatedAt(LocalDateTime.now());
    serviceForm.setCustomerId(customer.getId());

    ServiceForm savedForm = serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
            "Doğrudan servis formu oluşturuldu: vehicleID=%d, currentKm=%d",
            request.getVehicleId(), request.getCurrentKm()
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

    ServiceForm serviceForm = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    ServiceFormResponseDto dto = serviceFormMapper.toServiceFormResponseDto(serviceForm);
    
    List<ServiceFormItem> items = serviceFormItemRepository.findByServiceFormIdAndDeletedAtIsNull(serviceFormId);
    dto.setServiceFormItems(items.stream()
        .map(serviceFormItemMapper::toResponseDto)
        .collect(Collectors.toList()));
        
    return dto;
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
    ServiceForm serviceForm = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    if (serviceForm.getIsLocked() != null && serviceForm.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }

    serviceFormMapper.updateServiceForm(request, serviceForm);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    ServiceForm updatedForm = serviceFormRepository.save(serviceForm);
    return serviceFormMapper.toServiceFormResponseDto(updatedForm);
  }

  @Override
  public void deleteServiceForm(
          Integer serviceFormId,
          Integer userId
  ) {
    ServiceForm serviceForm = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    LocalDateTime now = LocalDateTime.now();
    serviceForm.setDeletedAt(now);
    serviceForm.setDeletedBy(userId);
    serviceFormRepository.save(serviceForm);
  }

  @Override
  @Transactional
  public void completeServiceForm(Integer serviceFormId, Integer userId) {
    ServiceForm serviceForm = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    if (serviceForm.getStatus() == ServiceFormStatus.COMPLETED) {
      throw new BusinessException("Servis formu zaten kapatildi", org.springframework.http.HttpStatus.CONFLICT);
    }

    boolean hasIncompleteItems = serviceFormItemRepository.existsByServiceFormIdAndStatusNot(
        serviceFormId,
        ServiceFormItemStatus.TAMAMLANDI
    );
    if (hasIncompleteItems) {
      throw new BusinessException("Tum is kalemleri tamamlanmadan is emri kapatilamaz",
          org.springframework.http.HttpStatus.CONFLICT);
    }

    serviceForm.setStatus(ServiceFormStatus.COMPLETED);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());
    serviceFormRepository.save(serviceForm);
  }

  @Override
  @Transactional
  public ServiceFormResponseDto assignStaff(Integer serviceFormId, Integer staffId, Integer userId) {
    ServiceForm serviceForm = serviceFormRepository.findByIdAndDeletedAtIsNull(serviceFormId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    serviceForm.setAssignedStaffId(staffId);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());

    ServiceForm savedForm = serviceFormRepository.save(serviceForm);
    return serviceFormMapper.toServiceFormResponseDto(savedForm);
  }
}
