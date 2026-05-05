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
    if (request == null) {
      throw new BusinessException(Messages.APPOINTMENT_REQUEST_INVALID);
    }

    Integer reqCustId = request.getCustomerId();
    Optional<Customer> customerOptional = customerRepository.findByIdAndDeletedAtIsNull(reqCustId);
    if (customerOptional.isEmpty()) {
      log.warn("Appointment create: customer not found for id={}", reqCustId);
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }
    Customer customer = customerOptional.get();

    // DÜZELTME: Müşterinin tenantId'si null olabilir (yeni yaratılmış olabilir)
    // Eğer tenantId null ise, randevu eklenen dükkanın (tenantId) yetkisini otomatik devralsın.
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId != null && !customerTenantId.equals(tenantId)) {
      // İşlemi yapan kullanıcı SUPER_ADMIN ise her türlü tenant'a işlem yapabilsin
      User currentUser = userRepository.findById(userId).orElse(null);
      boolean isSuperAdmin = currentUser != null && com.velauto.entity.enums.Role.SUPER_ADMIN.equals(currentUser.getRole());

      if (!isSuperAdmin) {
        throw new BusinessException(Messages.UNAUTHORIZED_ACCESS);
      }
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
    // Frontedden bazen saniyesiz aynı saatte istek gelebilir, "Geçmiş zaman" hatasına düşmemek için 1-2 dakikalık tolerans eklenebilir.
    // Eğer randevu tarihi şu andan "çok" önceyse hata fırlat (tolerans: 5 dakika)
    if (request.getAppointmentDate().isBefore(now.minusMinutes(5))) {
      throw new BusinessException(Messages.APPOINTMENT_DATE_INVALID);
    }

    Appointment appointment = appointmentMapper.toAppointment(request);

    // Status eğer DTO'dan gelmezse (null ise) varsayılan olarak atayalım (Önceki 500 hatalarını engeller)
    if (appointment.getStatus() == null) {
      appointment.setStatus(com.velauto.entity.enums.AppointmentStatus.PENDING);
    }



    appointment.setTenantId(tenantId);
    appointment.setCreatedBy(userId);
    appointment.setCreatedAt(now);

    Appointment savedAppointment = appointmentRepository.save(appointment);

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
    if (appointmentId == null || tenantId == null) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

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
    if (customerId == null || tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Customer> customerOptional = customerRepository.findByIdAndDeletedAtIsNull(customerId);
    if (customerOptional.isEmpty()) {
      log.warn("getAppointmentsByCustomer: customer not found for id={}", customerId);
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Customer customer = customerOptional.get();
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId != null && !customerTenantId.equals(tenantId)) {
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
    if (vehicleId == null || tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Vehicle> vehicleOptional = vehicleRepository.findById(vehicleId);
    if (vehicleOptional.isEmpty()) {
      throw new BusinessException(Messages.VEHICLE_NOT_FOUND);
    }

    Vehicle vehicle = vehicleOptional.get();
    Integer vehicleCustomerId = vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null;

    if (vehicleCustomerId == null) {
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }

    Optional<Customer> customerOptional = customerRepository.findByIdAndDeletedAtIsNull(vehicleCustomerId);
    if (customerOptional.isEmpty()) {
      log.warn("getAppointmentsByVehicle: customer not found for id={}", vehicleCustomerId);
      throw new BusinessException(Messages.CUSTOMER_NOT_FOUND);
    }
    Customer customer = customerOptional.get();
    Integer customerTenantId = customer.getUser() != null ? customer.getUser().getTenantId() : null;
    if (customerTenantId != null && !customerTenantId.equals(tenantId)) {
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
    if (appointmentId == null || request == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();

    if (appointment.getDeletedAt() != null) {
      throw new BusinessException(Messages.APPOINTMENT_DELETED);
    }

    String oldStatus = appointment.getStatus().toString();
    LocalDateTime oldDate = appointment.getAppointmentDate();

    appointmentMapper.updateAppointment(request, appointment);
    appointment.setUpdatedBy(userId);
    appointment.setUpdatedAt(LocalDateTime.now());

    Appointment updatedAppointment = appointmentRepository.save(appointment);

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
    if (appointmentId == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<Appointment> appointmentOptional = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId);
    if (appointmentOptional.isEmpty()) {
      throw new BusinessException(Messages.APPOINTMENT_NOT_FOUND);
    }

    Appointment appointment = appointmentOptional.get();

    if (appointment.getDeletedAt() != null) {
      throw new BusinessException(Messages.APPOINTMENT_ALREADY_DELETED);
    }

    LocalDateTime now = LocalDateTime.now();
    appointment.setDeletedAt(now);
    appointment.setDeletedBy(userId);

    appointmentRepository.save(appointment);

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

    String normalizedPhone;
    try {
      normalizedPhone = PhoneUtils.normalize(request.getPhone());
      if (!normalizedPhone.matches("^\\+\\d{10,15}$")) {
        throw new BusinessException("Geçersiz telefon numarası formatı");
      }
    } catch (IllegalArgumentException e) {
      throw new BusinessException("Telefon numarası normalize edilemedi");
    }

    String sanitizedFirstName = XssUtils.sanitize(request.getFirstName());
    String sanitizedLastName = XssUtils.sanitize(request.getLastName());

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

    String normalizedPlate = request.getPlate()
            .replaceAll("[^A-Z0-9]", "")
            .toUpperCase();

    if (normalizedPlate.isBlank() || normalizedPlate.length() < 2) {
      throw new BusinessException("Geçersiz plaka formatı");
    }

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

    String imageUrl = null;
    if (request.getDamageImage() != null && !request.getDamageImage().isEmpty()) {
      long maxFileSize = 5 * 1024 * 1024;
      if (request.getDamageImage().getSize() > maxFileSize) {
        throw new BusinessException("Dosya çok büyük (max 5MB)");
      }

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

    Appointment appointment = Appointment.builder()
            .customerId(customer.getId())
            .vehicleId(vehicle.getId())
            .status(com.velauto.entity.enums.AppointmentStatus.PENDING)
            .tenantId(tenantId)
            .createdAt(LocalDateTime.now())
            .build();

    Appointment savedAppointment = appointmentRepository.save(appointment);

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
    String rawPassword = generateSecurePassword();

    User newUser = new User();
    newUser.setEmail(request.getEmail());
    newUser.setFirstName(request.getFirstName());
    newUser.setLastName(request.getLastName());
    newUser.setPhone(request.getPhone());
    newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
    newUser.setRole(com.velauto.entity.enums.Role.CUSTOMER);
    newUser.setActive(true);
    newUser.setTenantId(tenantId);
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