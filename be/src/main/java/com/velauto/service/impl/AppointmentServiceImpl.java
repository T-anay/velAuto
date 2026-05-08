package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.AppointmentCreateDto;
import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.AppointmentUpdateDto;
import com.velauto.entity.Appointment;
import com.velauto.entity.Brand;
import com.velauto.entity.Customer;
import com.velauto.entity.User;
import com.velauto.entity.Vehicle;
import com.velauto.entity.VehicleModel;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.AppointmentMapper;
import com.velauto.repository.AppointmentRepository;
import com.velauto.repository.BrandRepository;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.UserRepository;
import com.velauto.repository.VehicleModelRepository;
import com.velauto.repository.VehicleRepository;
import com.velauto.service.AppointmentService;
import com.velauto.service.AuditLogService;
import com.velauto.service.FileStorageService;
import com.velauto.service.NotificationService;
import com.velauto.service.EmailService;
import com.velauto.utility.PhoneUtils;
import com.velauto.utility.XssUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

  private final AppointmentRepository appointmentRepository;
  private final CustomerRepository customerRepository;
  private final VehicleRepository vehicleRepository;
  private final AppointmentMapper appointmentMapper;
  private final AuditLogService auditLogService;
  private final UserRepository userRepository;
  private final BrandRepository brandRepository;
  private final VehicleModelRepository vehicleModelRepository;
  private final PasswordEncoder passwordEncoder;
  private final FileStorageService fileStorageService;
  private final NotificationService notificationService;
  private final EmailService emailService;

  @Override
  public AppointmentResponseDto createAppointment(
      AppointmentCreateDto request,
      Integer userId) {
    if (request == null) {
      throw new BusinessException(Messages.APPOINTMENT_REQUEST_INVALID);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(request.getVehicleId());
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }
    Vehicle vehicle = vehicleOptional.get();

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException(Messages.VEHICLE_DELETED);
    }

    Integer vehicleCustomerId = vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null;
    if (vehicleCustomerId == null || !vehicleCustomerId.equals(request.getCustomerId())) {
      throw new BusinessException(Messages.VEHICLE_CUSTOMER_MISMATCH);
    }

    LocalDateTime now = LocalDateTime.now();
    if (request.getAppointmentDate().isBefore(now.minusMinutes(5))) {
      throw new BusinessException(Messages.APPOINTMENT_DATE_INVALID);
    }

    Appointment appointment = appointmentMapper.toAppointment(request);

    if (appointment.getStatus() == null) {
      appointment.setStatus(com.velauto.entity.enums.AppointmentStatus.PENDING);
    }

    appointment.setCreatedBy(userId);
    appointment.setCreatedAt(now);

    Appointment savedAppointment = appointmentRepository.save(appointment);

    String auditDetails = String.format(
        "Randevu oluşturuldu: customerID=%d, vehicleID=%d, date=%s, notes=%s",
        appointment.getCustomerId(),
        appointment.getVehicleId(),
        appointment.getAppointmentDate(),
        appointment.getNotes());
    auditLogService.log(userId, "APPOINTMENT_CREATED", "APPOINTMENT", savedAppointment.getId(), auditDetails);

    return appointmentMapper.toAppointmentResponseDto(savedAppointment);
  }

  @Override
  @Transactional(readOnly = true)
  public AppointmentResponseDto getAppointmentById(
      Integer appointmentId,
      Integer userId) {
    if (appointmentId == null) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndDeletedAtIsNull(appointmentId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();
    return appointmentMapper.toAppointmentResponseDto(appointment);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByTenant(Pageable pageable) {
    if (pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<Appointment> appointments = appointmentRepository.findAllByDeletedAtIsNull(pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByCustomer(
      Integer customerId,
      Pageable pageable) {
    if (customerId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Customer> customerOptional = customerRepository.findByIdAndDeletedAtIsNull(customerId);
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Page<Appointment> appointments = appointmentRepository.findByCustomerIdAndDeletedAtIsNull(customerId, pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByVehicle(
      Integer vehicleId,
      Pageable pageable) {
    if (vehicleId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(vehicleId);
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }

    Page<Appointment> appointments = appointmentRepository.findByVehicleIdAndDeletedAtIsNull(vehicleId, pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public List<AppointmentResponseDto> getAppointmentsByDateRange(
      LocalDateTime startDate,
      LocalDateTime endDate) {
    if (startDate == null || endDate == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    if (startDate.isAfter(endDate)) {
      throw new BusinessException(Messages.INVALID_DATE_RANGE);
    }

    List<Appointment> appointments = appointmentRepository.findByDateRangeAndDeletedAtIsNull(startDate, endDate);
    return appointments.stream()
        .map(appointmentMapper::toAppointmentResponseDto)
        .toList();
  }

  @Override
  public AppointmentResponseDto updateAppointment(
      Integer appointmentId,
      AppointmentUpdateDto request,
      Integer userId) {
    if (appointmentId == null || request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndDeletedAtIsNull(appointmentId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();

    com.velauto.entity.enums.AppointmentStatus oldStatus = appointment.getStatus();
    LocalDateTime oldDate = appointment.getAppointmentDate();

    appointmentMapper.updateAppointment(request, appointment);
    appointment.setUpdatedBy(userId);
    appointment.setUpdatedAt(LocalDateTime.now());

    Appointment updatedAppointment = appointmentRepository.save(appointment);

    com.velauto.entity.enums.AppointmentStatus newStatus = updatedAppointment.getStatus();

    if (oldStatus != newStatus) {
      sendAppointmentStatusEmail(updatedAppointment, null);
    }

    String auditDetails = String.format(
        "Randevu güncellendi: status=%s→%s, date=%s→%s, notes=%s",
        oldStatus,
        newStatus,
        oldDate,
        updatedAppointment.getAppointmentDate(),
        updatedAppointment.getNotes());
    auditLogService.log(userId, "APPOINTMENT_UPDATED", "APPOINTMENT", updatedAppointment.getId(), auditDetails);

    return appointmentMapper.toAppointmentResponseDto(updatedAppointment);
  }

  @Override
  public void deleteAppointment(
      Integer appointmentId,
      Integer userId) {
    if (appointmentId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndDeletedAtIsNull(appointmentId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();

    LocalDateTime now = LocalDateTime.now();
    appointment.setDeletedAt(now);
    appointment.setDeletedBy(userId);
    appointment.setStatus(com.velauto.entity.enums.AppointmentStatus.CANCELLED);

    appointmentRepository.save(appointment);

    sendAppointmentStatusEmail(appointment, "Randevunuz sistem üzerinden iptal edilmiştir.");

    auditLogService.log(userId, "APPOINTMENT_DELETED", "APPOINTMENT", appointmentId, "Randevu silindi");
  }

  @Override
  public AppointmentResponseDto reviseAppointment(Integer id, LocalDateTime newDate, String notes, Integer userId) {
    Appointment appointment = appointmentRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new BusinessException(Messages.APPOINTMENT_NOT_FOUND));

    LocalDateTime oldDate = appointment.getAppointmentDate();
    appointment.setAppointmentDate(newDate);
    appointment.setStatus(com.velauto.entity.enums.AppointmentStatus.REVISED);
    appointment.setNotes(notes);
    appointment.setUpdatedBy(userId);
    appointment.setUpdatedAt(LocalDateTime.now());

    Appointment saved = appointmentRepository.save(appointment);

    sendAppointmentStatusEmail(saved, notes);

    auditLogService.log(userId, "APPOINTMENT_REVISED", "APPOINTMENT", id,
        String.format("Randevu revize edildi: %s -> %s. Not: %s", oldDate, newDate, notes));

    return appointmentMapper.toAppointmentResponseDto(saved);
  }

  @Override
  @Transactional
  public AppointmentResponseDto bookOnlineAppointment(com.velauto.dto.PublicAppointmentRequestDto request) {
    if (request == null || request.getPhone() == null) {
      throw new BusinessException("Eksik bilgi");
    }

    String normalizedPhone = PhoneUtils.normalize(request.getPhone());
    String sanitizedFirstName = XssUtils.sanitize(request.getFirstName());
    String sanitizedLastName = XssUtils.sanitize(request.getLastName());

    Optional<User> existingUserOptional = userRepository.findByPhoneAndDeletedAtIsNull(normalizedPhone);

    Customer customer;
    if (existingUserOptional.isPresent()) {
      customer = customerRepository.findByUser(existingUserOptional.get())
          .orElseThrow(() -> new BusinessException("Müşteri profili bulunamadı"));
    } else {
      String uniqueEmail = generateUniqueEmail();
      com.velauto.dto.CustomerCreateDto customerCreateDto = com.velauto.dto.CustomerCreateDto.builder()
          .firstName(sanitizedFirstName)
          .lastName(sanitizedLastName)
          .phone(normalizedPhone)
          .email(uniqueEmail)
          .address("")
          .customerType("INDIVIDUAL")
          .build();
      customer = createInternalCustomer(customerCreateDto);
    }

    String normalizedPlate = request.getPlate().replaceAll("[^A-Z0-9]", "").toUpperCase();
    Optional<Vehicle> vehicleOptional = vehicleRepository.findByCustomerIdAndPlate(customer.getId(), normalizedPlate);

    Vehicle vehicle;
    if (vehicleOptional.isPresent() && vehicleOptional.get().getDeletedAt() == null) {
      vehicle = vehicleOptional.get();
    } else {
      vehicle = new Vehicle();
      vehicle.setCustomer(customer);
      vehicle.setLicensePlate(normalizedPlate);
      Brand brand = findOrCreateBrand(request.getBrand());
      VehicleModel model = findOrCreateModel(request.getModel(), brand);
      vehicle.setBrand(brand);
      vehicle.setVehicleModel(model);
      vehicle.setCreatedAt(LocalDateTime.now());
      vehicle = vehicleRepository.save(vehicle);
    }

    Appointment appointment = Appointment.builder()
        .customerId(customer.getId())
        .vehicleId(vehicle.getId())
        .appointmentDate(LocalDateTime.now().plusDays(1))
        .status(com.velauto.entity.enums.AppointmentStatus.PENDING)
        .notes(XssUtils.sanitize(request.getComplaint()))
        .createdAt(LocalDateTime.now())
        .build();

    Appointment savedAppointment = appointmentRepository.save(appointment);

    notificationService.sendSystemNotification(
        "Yeni Randevu Talebi",
        String.format("%s plakalı araç için %s %s tarafından yeni bir randevu oluşturuldu.",
            request.getPlate(), request.getFirstName(), request.getLastName()));

    sendAppointmentStatusEmail(savedAppointment, "Randevu talebiniz başarıyla alınmıştır.");

    return appointmentMapper.toAppointmentResponseDto(savedAppointment);
  }

  private void sendAppointmentStatusEmail(Appointment appointment, String customNotes) {
    try {
      Customer customer = customerRepository.findById(appointment.getCustomerId()).orElse(null);
      Vehicle vehicle = vehicleRepository.findById(appointment.getVehicleId()).orElse(null);
      if (customer != null && customer.getUser() != null && customer.getUser().getEmail() != null) {
        String plate = vehicle != null ? vehicle.getLicensePlate() : "---";
        String dateStr = appointment.getAppointmentDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
        emailService.sendAppointmentStatusEmail(
            customer.getUser().getEmail(),
            customer.getUser().getFirstName() + " " + customer.getUser().getLastName(),
            plate,
            appointment.getStatus().getDisplayName(),
            dateStr,
            customNotes != null ? customNotes : appointment.getNotes());
      }
    } catch (Exception e) {
      log.error("Mail error: {}", e.getMessage());
    }
  }

  private String generateUniqueEmail() {
    return java.util.UUID.randomUUID().toString().substring(0, 8) + "_" + System.currentTimeMillis()
        + "@velauto-temp.local";
  }

  private Customer createInternalCustomer(com.velauto.dto.CustomerCreateDto request) {
    String rawPassword = generateSecurePassword();
    User newUser = new User();
    newUser.setEmail(request.getEmail());
    newUser.setFirstName(request.getFirstName());
    newUser.setLastName(request.getLastName());
    newUser.setPhone(request.getPhone());
    newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
    newUser.setRole(com.velauto.entity.enums.Role.CUSTOMER);
    newUser.setActive(true);
    newUser.setCreatedAt(LocalDateTime.now());
    User savedUser = userRepository.save(newUser);
    notificationService.sendWelcomePassword(newUser.getPhone(), rawPassword);
    Customer newCustomer = new Customer();
    newCustomer.setUser(savedUser);
    newCustomer.setCustomerType(com.velauto.entity.enums.CustomerType.INDIVIDUAL);
    newCustomer.setDiscountRate(BigDecimal.ZERO);
    newCustomer.setCreatedAt(LocalDateTime.now());
    return customerRepository.save(newCustomer);
  }

  private Brand findOrCreateBrand(String brandName) {
    String normalizedName = XssUtils.sanitize(brandName == null ? "Bilinmeyen" : brandName.trim());
    return brandRepository.findByName(normalizedName).orElseGet(() -> {
      Brand b = new Brand();
      b.setName(normalizedName);
      return brandRepository.save(b);
    });
  }

  private VehicleModel findOrCreateModel(String modelName, Brand brand) {
    String normalizedName = XssUtils.sanitize(modelName == null ? "Bilinmeyen" : modelName.trim());
    return vehicleModelRepository.findByName(normalizedName)
        .filter(m -> m.getBrand() != null && m.getBrand().getId().equals(brand.getId()))
        .orElseGet(() -> {
          VehicleModel m = new VehicleModel();
          m.setName(normalizedName);
          m.setBrand(brand);
          return vehicleModelRepository.save(m);
        });
  }

  private String generateSecurePassword() {
    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    StringBuilder sb = new StringBuilder();
    java.security.SecureRandom random = new java.security.SecureRandom();
    for (int i = 0; i < 12; i++)
      sb.append(chars.charAt(random.nextInt(chars.length())));
    return sb.toString();
  }
}
