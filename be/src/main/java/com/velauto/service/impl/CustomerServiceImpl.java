package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.CustomerCreateDto;
import com.velauto.dto.CustomerResponseDto;
import com.velauto.dto.CustomerUpdateDto;
import com.velauto.entity.Customer;
import com.velauto.entity.User;
import com.velauto.entity.enums.CustomerType;
import com.velauto.entity.enums.Role;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.CustomerMapper;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.UserRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.CustomerService;
import com.velauto.service.NotificationService;
import com.velauto.utility.PhoneUtils;
import com.velauto.utility.XssUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

  private final CustomerRepository customerRepository;
  private final UserRepository userRepository;
  private final CustomerMapper customerMapper;
  private final AuditLogService auditLogService;
  private final NotificationService notificationService;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public CustomerResponseDto createCustomer(CustomerCreateDto request, Integer currentUserId) {
      log.info("Müşteri oluşturma talebi: phone={}, createdBy={}",
        request.getPhone(), currentUserId);

    String normalizedPhone;
    try {
      normalizedPhone = PhoneUtils.normalize(request.getPhone());
    } catch (IllegalArgumentException e) {
      throw new BusinessException("Geçersiz telefon numarası: " + e.getMessage(), HttpStatus.BAD_REQUEST);
    }

    String firstName = request.getFirstName();
    String lastName = request.getLastName();
    if ((firstName == null || firstName.isBlank()) && (lastName == null || lastName.isBlank()) && request.getCustomer() != null) {
      String[] nameParts = request.getCustomer().trim().split("\\s+", 2);
      firstName = nameParts.length > 0 ? nameParts[0] : null;
      lastName = nameParts.length > 1 ? nameParts[1] : null;
    }

    String rawPassword = RandomStringUtils.secure().nextAlphanumeric(8);
    log.debug("Generated raw password for new customer: length={}", rawPassword.length());

    User newUser = new User();
    newUser.setFirstName(firstName);
    newUser.setLastName(lastName);
    newUser.setPhone(normalizedPhone);
    newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
    // DÜZELTME: customer yerine CUSTOMER yapıldı
    newUser.setRole(Role.CUSTOMER);
    newUser.setActive(true);
        newUser.setCreatedBy(currentUserId);

    User savedUser = userRepository.save(newUser);
    log.info("User created for customer: userId={}", savedUser.getId());

    notificationService.sendWelcomePassword(normalizedPhone, rawPassword);
    log.info("Welcome password notification sent to phone={}", normalizedPhone);

    Customer newCustomer = new Customer();
    newCustomer.setUser(savedUser);
    newCustomer.setAddress(request.getAddress() != null ? XssUtils.sanitize(request.getAddress()) : null);
    newCustomer.setTaxNumber(request.getTaxNumber());
    newCustomer.setTaxOffice(request.getTaxOffice());
    newCustomer.setCompanyName(request.getCompanyName());

    if (request.getCustomerType() != null) {
      try {
        newCustomer.setCustomerType(CustomerType.valueOf(request.getCustomerType()));
      } catch (IllegalArgumentException e) {
        newCustomer.setCustomerType(CustomerType.INDIVIDUAL);
      }
    } else {
      newCustomer.setCustomerType(CustomerType.INDIVIDUAL);
    }

    newCustomer.setDiscountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO);

    Customer savedCustomer = customerRepository.save(newCustomer);
    log.info("Customer created: customerId={}, userId={}", savedCustomer.getId(), savedUser.getId());

    String auditDetails = String.format(
          "Müşteri oluşturuldu: ad=%s, soyad=%s, phone=%s, customerType=%s, oluşturan=%d, zaman=%s",
            savedUser.getFirstName(),
            savedUser.getLastName(),
            normalizedPhone,
            newCustomer.getCustomerType(),
            currentUserId,
            LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "CUSTOMER_CREATED", "CUSTOMER", savedCustomer.getId(), auditDetails);

    return customerMapper.toCustomerResponse(savedCustomer);
  }

  @Override
  @Transactional
  public CustomerResponseDto updateCustomer(Integer customerId, CustomerUpdateDto request, Integer currentUserId) {
    log.info("Müşteri güncelleme talebi: customerId={}, updatedBy={}", customerId, currentUserId);

    Customer customer = customerRepository.findByIdAndDeletedAtIsNull(customerId)
            .orElseThrow(() -> {
              log.warn("Customer update: customer not found for id={}", customerId);
              return new BusinessException("Müşteri bulunamadı (id=" + customerId + ")", HttpStatus.NOT_FOUND);
            });

    User user = customer.getUser();
    if (user == null) {
      throw new BusinessException("Müşteri User bilgisi eksik", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    String oldFirstName = user.getFirstName();
    String oldLastName = user.getLastName();
    String oldPhone = user.getPhone();

    if (request.getPhone() != null && !request.getPhone().isBlank()) {
      String normalizedPhone;
      try {
        normalizedPhone = PhoneUtils.normalize(request.getPhone());
      } catch (IllegalArgumentException e) {
        throw new BusinessException("Geçersiz telefon numarası: " + e.getMessage(), HttpStatus.BAD_REQUEST);
      }
      user.setPhone(normalizedPhone);
    }

    if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
      user.setFirstName(request.getFirstName());
    }
    if (request.getLastName() != null && !request.getLastName().isBlank()) {
      user.setLastName(request.getLastName());
    }

    if (request.getAddress() != null) {
      customer.setAddress(XssUtils.sanitize(request.getAddress()));
    }
    if (request.getTaxNumber() != null) {
      customer.setTaxNumber(request.getTaxNumber());
    }
    if (request.getTaxOffice() != null) {
      customer.setTaxOffice(request.getTaxOffice());
    }
    if (request.getCompanyName() != null) {
      customer.setCompanyName(request.getCompanyName());
    }
    if (request.getCustomerType() != null) {
      try {
        customer.setCustomerType(CustomerType.valueOf(request.getCustomerType()));
      } catch (IllegalArgumentException e) {
      }
    }
    if (request.getDiscountRate() != null) {
      customer.setDiscountRate(request.getDiscountRate());
    }

    user.setUpdatedBy(currentUserId);
    user.setUpdatedAt(LocalDateTime.now());
    customer.setUpdatedBy(currentUserId);
    customer.setUpdatedAt(LocalDateTime.now());

    User updatedUser = userRepository.save(user);
    Customer updatedCustomer = customerRepository.save(customer);

    String auditDetails = String.format(
            "Müşteri güncellendi: eski_ad=%s, yeni_ad=%s, eski_soyad=%s, yeni_soyad=%s, eski_phone=%s, yeni_phone=%s, " +
                    "eski_address=%s, yeni_address=%s, güncelleyen=%d, zaman=%s",
            oldFirstName,
            updatedUser.getFirstName(),
            oldLastName,
            updatedUser.getLastName(),
            oldPhone,
            updatedUser.getPhone(),
            customer.getAddress(),
            updatedCustomer.getAddress(),
            currentUserId,
            LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "CUSTOMER_UPDATED", "CUSTOMER", updatedCustomer.getId(), auditDetails);

    log.info("Müşteri güncellendi: customerId={}", updatedCustomer.getId());

    return customerMapper.toCustomerResponse(updatedCustomer);
  }

  @Override
  @Transactional(readOnly = true)
  public CustomerResponseDto getCustomerById(Integer customerId) {
        Customer customer = customerRepository.findByIdAndDeletedAtIsNull(customerId)
          .orElseThrow(() -> new BusinessException("Müşteri bulunamadı (id=" + customerId + ")", HttpStatus.NOT_FOUND));

    return customerMapper.toCustomerResponse(customer);
  }

  @Override
  @Transactional(readOnly = true)
  public CustomerResponseDto getByPhone(String phone) {
    if (phone == null || phone.isBlank()) {
      throw new BusinessException("Telefon numarasi bos birakilamaz", HttpStatus.BAD_REQUEST);
    }

    Customer customer = customerRepository.findByUserPhone(phone)
            .orElseThrow(() -> new BusinessException("Telefon ile eslesem musteri bulunamadi", HttpStatus.NOT_FOUND));

    return customerMapper.toCustomerResponse(customer);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<CustomerResponseDto> getCustomersByTenant(Pageable pageable) {
    if (pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }
    Page<Customer> customers = customerRepository.findAll(pageable);
    return customers.map(customerMapper::toCustomerResponse);
  }

  @Override
  @Transactional
  public void deleteCustomer(Integer customerId, Integer currentUserId) {
    log.info("Müşteri silme talebi: customerId={}, deletedBy={}", customerId, currentUserId);

    Optional<Customer> maybeCustomer = customerRepository.findById(customerId);
    if (maybeCustomer.isEmpty()) {
      log.warn("Müşteri silme talebi: customerId={} bulunamadı, işlem idempotent olarak sonlandırıldı", customerId);
      return;
    }

    Customer customer = maybeCustomer.get();

    if (customer.getDeletedAt() != null) {
      log.info("Müşteri zaten silinmiş: customerId={}", customerId);
      return;
    }

    customer.setDeletedAt(LocalDateTime.now());
    customer.setDeletedBy(currentUserId);

    customerRepository.save(customer);

    User user = customer.getUser();
    String firstName = user != null ? user.getFirstName() : "N/A";
    String phone = user != null ? user.getPhone() : "N/A";
    String auditDetails = String.format(
            "Müşteri silindi (soft delete): ad=%s, telefon=%s, silinen=%d, zaman=%s",
            firstName,
            phone,
            currentUserId,
            LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "CUSTOMER_DELETED", "CUSTOMER", customerId, auditDetails);

    log.info("Müşteri silindi: customerId={}", customerId);
  }
}