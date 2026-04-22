package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.AppointmentCreateDto;
import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.AppointmentUpdateDto;
import com.velauto.entity.Appointment;
import com.velauto.entity.Customer;
import com.velauto.entity.User;
import com.velauto.entity.Vehicle;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.AppointmentMapper;
import com.velauto.repository.AppointmentRepository;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.UserRepository;
import com.velauto.repository.VehicleRepository;
import com.velauto.service.AppointmentService;
import com.velauto.service.AuditLogService;
import com.velauto.service.FileStorageService;
import com.velauto.service.NotificationService;
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
  private final PasswordEncoder passwordEncoder;
  private final FileStorageService fileStorageService;
  private final NotificationService notificationService;

  @Override
  public AppointmentResponseDto createAppointment(
      AppointmentCreateDto request,
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (request == null) {
      throw new BusinessException(Messages.APPOINTMENT_REQUEST_INVALID);
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

    // Guard Clause: Vehicle belongs to same customer?
    Integer vehicleCustomerId = vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null;
    if (vehicleCustomerId == null || !vehicleCustomerId.equals(request.getCustomerId())) {
      throw new BusinessException(Messages.VEHICLE_CUSTOMER_MISMATCH);
    }

    // Guard Clause: Appointment date validation
    LocalDateTime now = LocalDateTime.now();
    if (request.getAppointmentDate().isBefore(now)) {
      throw new BusinessException(Messages.APPOINTMENT_DATE_INVALID);
    }

    // Map DTO to Entity
    Appointment appointment = appointmentMapper.toAppointment(request);
    appointment.setTenantId(tenantId);
    appointment.setCreatedBy(userId);
    appointment.setCreatedAt(now);

    // Save appointment
    Appointment savedAppointment = appointmentRepository.save(appointment);

    // Audit log - Single responsibility per line
    String auditDetails = String.format(
        "Randevu oluşturuldu: customerID=%d, vehicleID=%d, date=%s, notes=%s",
        appointment.getCustomerId(),
        appointment.getVehicleId(),
        appointment.getAppointmentDate(),
        appointment.getNotes()
    );
    auditLogService.log(userId, "APPOINTMENT_CREATED", "APPOINTMENT", savedAppointment.getId(), auditDetails);

    return appointmentMapper.toAppointmentResponseDto(savedAppointment);
  }

  @Override
  @Transactional(readOnly = true)
  public AppointmentResponseDto getAppointmentById(
      Integer appointmentId,
      Integer tenantId
  ) {
    // Guard Clause: Validate input
    if (appointmentId == null || tenantId == null) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    // Fetch appointment - No Optional chaining
    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();
    return appointmentMapper.toAppointmentResponseDto(appointment);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByTenant(
      Integer tenantId,
      Pageable pageable
  ) {
    // Guard Clause: Validate input
    if (tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<Appointment> appointments = appointmentRepository.findByTenantId(tenantId, pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByCustomer(
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

    // Guard Clause: Customer belongs to tenant?
    Customer customer = customerOptional.get();
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId == null || !customerTenantId.equals(tenantId)) {
      throw new BusinessException(Messages.UNAUTHORIZED_ACCESS);
    }

    Page<Appointment> appointments = appointmentRepository.findByCustomerIdAndTenantId(customerId, tenantId, pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AppointmentResponseDto> getAppointmentsByVehicle(
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

    // Guard Clause: Vehicle belongs to tenant's customer?
    Vehicle vehicle = vehicleOptional.get();
    Integer vehicleCustomerId = vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null;

    if (vehicleCustomerId == null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Optional<Customer> customerOptional = customerRepository.findById(vehicleCustomerId);
    if (customerOptional.isEmpty()) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }
    Customer customer = customerOptional.get();
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId == null || !customerTenantId.equals(tenantId)) {
      throw new BusinessException(Messages.UNAUTHORIZED_ACCESS);
    }

    Page<Appointment> appointments = appointmentRepository.findByVehicleIdAndTenantId(vehicleId, tenantId, pageable);
    return appointments.map(appointmentMapper::toAppointmentResponseDto);
  }

  @Override
  @Transactional(readOnly = true)
  public List<AppointmentResponseDto> getAppointmentsByDateRange(
      Integer tenantId,
      LocalDateTime startDate,
      LocalDateTime endDate
  ) {
    // Guard Clause: Validate input
    if (tenantId == null || startDate == null || endDate == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    if (startDate.isAfter(endDate)) {
      throw new BusinessException(Messages.INVALID_DATE_RANGE);
    }

    List<Appointment> appointments = appointmentRepository.findByTenantIdAndDateRange(tenantId, startDate, endDate);
    return appointments.stream()
        .map(appointmentMapper::toAppointmentResponseDto)
        .toList();
  }

  @Override
  public AppointmentResponseDto updateAppointment(
      Integer appointmentId,
      AppointmentUpdateDto request,
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

    // Guard Clause: Appointment deleted?
    if (appointment.getDeletedAt() != null) {
      throw new BusinessException(Messages.APPOINTMENT_DELETED);
    }

    // Store old values for audit - Single responsibility
    String oldStatus = appointment.getStatus().toString();
    LocalDateTime oldDate = appointment.getAppointmentDate();

    // Update appointment
    appointmentMapper.updateAppointment(request, appointment);
    appointment.setUpdatedBy(userId);
    appointment.setUpdatedAt(LocalDateTime.now());

    Appointment updatedAppointment = appointmentRepository.save(appointment);

    // Audit log - Single responsibility per line
    String newStatus = updatedAppointment.getStatus().toString();
    String auditDetails = String.format(
        "Randevu güncellendi: status=%s→%s, date=%s→%s, notes=%s",
        oldStatus,
        newStatus,
        oldDate,
        updatedAppointment.getAppointmentDate(),
        updatedAppointment.getNotes()
    );
    auditLogService.log(userId, "APPOINTMENT_UPDATED", "APPOINTMENT", updatedAppointment.getId(), auditDetails);

    return appointmentMapper.toAppointmentResponseDto(updatedAppointment);
  }

  @Override
  public void deleteAppointment(
      Integer appointmentId,
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (appointmentId == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch appointment - No Optional chaining
    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();

    // Guard Clause: Already deleted?
    if (appointment.getDeletedAt() != null) {
      throw new BusinessException(Messages.APPOINTMENT_ALREADY_DELETED);
    }

    // Soft delete - Single responsibility
    LocalDateTime now = LocalDateTime.now();
    appointment.setDeletedAt(now);
    appointment.setDeletedBy(userId);

    appointmentRepository.save(appointment);

    // Audit log
    String auditDetails = String.format(
        "Randevu silindi (soft delete): ID=%d, status=%s",
        appointment.getId(),
        appointment.getStatus()
    );
    auditLogService.log(userId, "APPOINTMENT_DELETED", "APPOINTMENT", appointmentId, auditDetails);
  }

  @Override
  @Transactional
  public AppointmentResponseDto bookOnlineAppointment(
      com.velauto.dto.PublicAppointmentRequestDto request,
      Integer tenantId
  ) {
    // STEP 1: Input validation
    if (request == null || request.getPhone() == null || request.getPhone().isBlank()) {
      throw new BusinessException("Telefon numarası gerekli");
    }
    if (request.getFirstName() == null || request.getFirstName().isBlank()) {
      throw new BusinessException("Ad gerekli");
    }
    if (request.getLastName() == null || request.getLastName().isBlank()) {
      throw new BusinessException("Soyadı gerekli");
    }
    if (request.getPlate() == null || request.getPlate().isBlank()) {
      throw new BusinessException("Plaka gerekli");
    }

    // STEP 2: Phone normalizasyon ve validation
    String normalizedPhone;
    try {
      normalizedPhone = PhoneUtils.normalize(request.getPhone());
      if (!normalizedPhone.matches("^\\+\\d{10,15}$")) {
        throw new BusinessException("Geçersiz telefon numarası formatı");
      }
    } catch (IllegalArgumentException e) {
      throw new BusinessException("Telefon numarası normalize edilemedi");
    }

    // STEP 3: XSS Protection - Input sanitization
    String sanitizedFirstName = XssUtils.sanitize(request.getFirstName());
    String sanitizedLastName = XssUtils.sanitize(request.getLastName());

    // STEP 4: Phone ve tenant ile müşteri ara
    Optional<User> existingUserOptional = userRepository.findByPhoneAndTenantId(normalizedPhone, tenantId);

    Customer customer;
    if (existingUserOptional.isPresent()) {
      User existingUser = existingUserOptional.get();
      if (existingUser.getDeletedAt() == null) {
        customer = customerRepository.findByUser(existingUser)
            .orElseThrow(() -> new BusinessException("Müşteri profili bulunamadı"));
      } else {
        throw new BusinessException("Bu telefon numarası silinmiştir");
      }
    } else {
      // STEP 5: Unique email generation (UUID + random)
      String uniqueEmail = generateUniqueEmail();

      com.velauto.dto.CustomerCreateDto customerCreateDto = com.velauto.dto.CustomerCreateDto.builder()
          .firstName(sanitizedFirstName)
          .lastName(sanitizedLastName)
          .phone(normalizedPhone)
          .email(uniqueEmail)
          .address("")
          .customerType("INDIVIDUAL")
          .build();

      customer = createInternalCustomer(customerCreateDto, tenantId);
    }

    // STEP 6: Plate normalizasyon ve validation
    String normalizedPlate = request.getPlate()
        .replaceAll("[^A-Z0-9]", "")
        .toUpperCase();

    if (normalizedPlate.isBlank() || normalizedPlate.length() < 2) {
      throw new BusinessException("Geçersiz plaka formatı");
    }

    // STEP 7: Vehicle ara veya oluştur
    Optional<Vehicle> vehicleOptional = vehicleRepository.findByCustomerIdAndPlate(customer.getId(), normalizedPlate);

    Vehicle vehicle;
    if (vehicleOptional.isPresent() && vehicleOptional.get().getDeletedAt() == null) {
      vehicle = vehicleOptional.get();
    } else {
      vehicle = new Vehicle();
      vehicle.setCustomer(customer);
      vehicle.setLicensePlate(normalizedPlate);
      vehicle.setCreatedAt(LocalDateTime.now());
      vehicle = vehicleRepository.save(vehicle);
    }

    // STEP 8: File upload with validation
    String imageUrl = null;
    if (request.getDamageImage() != null && !request.getDamageImage().isEmpty()) {
      // File size validation (5MB max)
      long maxFileSize = 5 * 1024 * 1024;
      if (request.getDamageImage().getSize() > maxFileSize) {
        throw new BusinessException("Dosya çok büyük (max 5MB)");
      }

      // File type validation
      String contentType = request.getDamageImage().getContentType();
      if (!isValidImageType(contentType)) {
        throw new BusinessException("Sadece PNG ve JPG dosyaları desteklenir");
      }

      try {
        byte[] fileBytes = request.getDamageImage().getBytes();
        String sanitizedFileName = sanitizeFileName(request.getDamageImage().getOriginalFilename());
        imageUrl = fileStorageService.uploadFile(fileBytes, sanitizedFileName);
      } catch (Exception e) {
        log.error("🚨 File upload hatası: tenantId={}, error={}", tenantId, e.getMessage());
        throw new BusinessException("Dosya yükleme başarısız oldu");
      }
    }

    // STEP 9: Appointment oluştur
    Appointment appointment = Appointment.builder()
        .customerId(customer.getId())
        .vehicleId(vehicle.getId())
        .status(com.velauto.entity.enums.AppointmentStatus.PENDING)
        .tenantId(tenantId)
        .createdAt(LocalDateTime.now())
        .build();

    Appointment savedAppointment = appointmentRepository.save(appointment);

    // STEP 10: Audit logging
    String auditDetails = String.format(
        "Online randevu: phone=%s, plate=%s, image=%s",
        normalizedPhone,
        normalizedPlate,
        imageUrl != null ? "uploaded" : "none"
    );
    auditLogService.log(customer.getUser().getId(), "ONLINE_APPOINTMENT_CREATED", "APPOINTMENT",
        savedAppointment.getId(), auditDetails);

    return appointmentMapper.toAppointmentResponseDto(savedAppointment);
  }

  private String generateUniqueEmail() {
    return java.util.UUID.randomUUID().toString().substring(0, 8) +
           "_" + System.currentTimeMillis() +
           "@velauto-temp.local";
  }

  private boolean isValidImageType(String contentType) {
    return contentType != null &&
           (contentType.equals("image/png") ||
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg"));
  }

  private String sanitizeFileName(String fileName) {
    if (fileName == null) return "image_" + System.currentTimeMillis();
    return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
  }

  private Customer createInternalCustomer(
      com.velauto.dto.CustomerCreateDto request,
      Integer tenantId
  ) {
    // Secure password generation (12+ chars, mixed case, digits, special chars)
    String rawPassword = generateSecurePassword();

    // Create User with proper validation
    User newUser = new User();
    newUser.setEmail(request.getEmail());
    newUser.setFirstName(request.getFirstName());
    newUser.setLastName(request.getLastName());
    newUser.setPhone(request.getPhone());
    newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
    newUser.setRole(com.velauto.entity.enums.Role.customer);
    newUser.setActive(true);
    newUser.setTenantId(tenantId);
    newUser.setCreatedAt(LocalDateTime.now());

    User savedUser = userRepository.save(newUser);

    // Send welcome notification
    notificationService.sendWelcomePassword(newUser.getPhone(), rawPassword);

    // Create Customer with proper values
    Customer newCustomer = new Customer();
    newCustomer.setUser(savedUser);
    newCustomer.setCustomerType(com.velauto.entity.enums.CustomerType.INDIVIDUAL);
    newCustomer.setDiscountRate(BigDecimal.ZERO);
    newCustomer.setCreatedAt(LocalDateTime.now());

    return customerRepository.save(newCustomer);
  }

  private String generateSecurePassword() {
    String uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    String lowercase = "abcdefghijklmnopqrstuvwxyz";
    String digits = "0123456789";
    String special = "!@#$%^&*";
    String all = uppercase + lowercase + digits + special;

    StringBuilder password = new StringBuilder();
    java.security.SecureRandom random = new java.security.SecureRandom();

    password.append(uppercase.charAt(random.nextInt(uppercase.length())));
    password.append(lowercase.charAt(random.nextInt(lowercase.length())));
    password.append(digits.charAt(random.nextInt(digits.length())));
    password.append(special.charAt(random.nextInt(special.length())));

    for (int i = 4; i < 12; i++) {
      password.append(all.charAt(random.nextInt(all.length())));
    }

    return password.toString();
  }
}
