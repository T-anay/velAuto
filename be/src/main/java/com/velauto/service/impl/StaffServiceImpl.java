package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.StaffCreateDto;
import com.velauto.dto.StaffResponseDto;
import com.velauto.dto.StaffUpdateDto;
import com.velauto.entity.Staff;
import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.StaffMapper;
import com.velauto.repository.StaffRepository;
import com.velauto.repository.UserRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.EmailService;
import com.velauto.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

  private final StaffRepository staffRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final StaffMapper staffMapper;
  private final AuditLogService auditLogService;
  private final EmailService emailService;

  @Override
  @Transactional
  public StaffResponseDto createStaff(StaffCreateDto request, Integer currentUserId) {
    // 1. Yetki Kontrolü
    User currentUser = userRepository.findByIdAndDeletedAtIsNull(currentUserId)
        .orElseThrow(() -> new BusinessException(Messages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED));

    if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
      throw new BusinessException(Messages.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN);
    }

    // 2. Email Kontrolü (Aynı emailli biri var mı?)
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new BusinessException("Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.", HttpStatus.BAD_REQUEST);
    }

    // 3. Yeni Personel için LOGIN (User) oluşturma
    User newUser = new User();
    newUser.setEmail(request.getEmail());

    // 8 haneli rastgele güvenli şifre oluştur
    String rawPassword = RandomStringUtils.secure().nextAlphanumeric(8);
    newUser.setPasswordHash(passwordEncoder.encode(rawPassword));

    // Rol ataması (Dışarıdan Super Admin gönderilemez)
    Role assignedRole = Role.STAFF; // Varsayılan
    if (request.getRole() != null) {
      try {
        Role parsedRole = Role.valueOf(request.getRole().toUpperCase());
        if (parsedRole == Role.SUPER_ADMIN) {
          throw new BusinessException("Dışarıdan manuel Super Admin eklenemez!", HttpStatus.FORBIDDEN);
        }
        assignedRole = parsedRole;
      } catch (IllegalArgumentException e) {
        log.warn("Geçersiz rol gönderildi, STAFF olarak devam ediliyor: {}", request.getRole());
      }
    }
    newUser.setRole(assignedRole);
    newUser.setActive(true);

    // İsimleri User tablosu için ayırma
    String fullName = request.getFullName() != null ? request.getFullName().trim() : "Personel";
    String[] names = fullName.split("\\s+", 2);
    newUser.setFirstName(names[0]);
    newUser.setLastName(names.length > 1 ? names[1] : "");

    // Telefon numarasını ayarla
    String phone = (request.getPhone() == null || request.getPhone().isBlank())
        ? "+90" + RandomStringUtils.secure().nextNumeric(10)
        : request.getPhone();
    newUser.setPhone(phone);

    // User'ı Kaydet
    User savedUser = userRepository.save(newUser);

    // 4. PERSONEL (Staff) KAYDINI OLUŞTUR VE USER'A BAĞLA
    Staff staff = new Staff();
    staff.setFullName(fullName);
    staff.setPhone(phone);
    staff.setUser(savedUser); // İŞTE KRİTİK NOKTA BURASI (Bire-Bir Bağlantı)

    Staff savedStaff = staffRepository.save(staff);

    // 5. MAIL GÖNDER (Personel'e bilgilerini ilet)
    try {
        emailService.sendStaffWelcomeEmail(savedUser.getEmail(), fullName, rawPassword);
        log.info("Personel hoş geldin maili sıraya alındı: {}", savedUser.getEmail());
    } catch (Exception e) {
        log.error("Mail gönderilirken bir hata oluştu: {}", e.getMessage());
    }

    log.info("YENİ PERSONEL OLUŞTURULDU -> Email: {} | Şifre: {}", savedUser.getEmail(), rawPassword);

    auditLogService.log(currentUserId, "STAFF_CREATED", "STAFF", savedStaff.getId(),
        "Staff created: " + fullName);

    return staffMapper.toResponseDto(savedStaff);
  }

  @Override
  @Transactional(readOnly = true)
  public List<StaffResponseDto> getAllStaff() {
    return staffRepository.findByDeletedAtIsNull().stream()
        .map(staffMapper::toResponseDto)
        .toList();
  }

  @Override
  @Transactional
  public StaffResponseDto updateStaff(Integer staffId, StaffUpdateDto request, Integer currentUserId) {
    User currentUser = userRepository.findByIdAndDeletedAtIsNull(currentUserId)
        .orElseThrow(() -> new BusinessException(Messages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED));

    if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
      throw new BusinessException(Messages.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN);
    }

    Staff staff = staffRepository.findById(staffId)
        .orElseThrow(() -> new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND));

    if (staff.getDeletedAt() != null) {
      throw new BusinessException("Staff silinmiş durumda", HttpStatus.BAD_REQUEST);
    }

    User user = staff.getUser();
    if (user != null && user.getRole() == Role.SUPER_ADMIN &&
        (request.getRole() != null || (request.getActive() != null && !request.getActive()))) {
      throw new BusinessException("Süper Admin bilgileri değiştirilemez veya pasife çekilemez", HttpStatus.FORBIDDEN);
    }

    // Staff güncelle
    if (request.getFullName() != null && !request.getFullName().isBlank()) {
      staff.setFullName(request.getFullName());
    }
    if (request.getPhone() != null && !request.getPhone().isBlank()) {
      staff.setPhone(request.getPhone());
    }

    // Bağlı User'ı güncelle
    if (user != null) {
      if (request.getFullName() != null && !request.getFullName().isBlank()) {
        String[] names = request.getFullName().trim().split("\\s+", 2);
        if (names.length > 0) user.setFirstName(names[0]);
        if (names.length > 1) user.setLastName(names[1]);
      }
      if (request.getPhone() != null && !request.getPhone().isBlank()) {
        user.setPhone(request.getPhone());
      }
      if (request.getRole() != null && !request.getRole().isBlank()) {
        try {
          Role newRole = Role.valueOf(request.getRole().toUpperCase());
          if (newRole != Role.SUPER_ADMIN) {
            user.setRole(newRole);
          }
        } catch (IllegalArgumentException e) {
          throw new BusinessException("Geçersiz rol: " + request.getRole(), HttpStatus.BAD_REQUEST);
        }
      }
      if (request.getActive() != null) {
        user.setActive(request.getActive());
      }
      userRepository.save(user);
    }

    Staff savedStaff = staffRepository.save(staff);

    auditLogService.log(currentUserId, "STAFF_UPDATED", "STAFF", staffId,
        "Staff updated: " + staff.getFullName());

    return staffMapper.toResponseDto(savedStaff);
  }

  @Override
  @Transactional
  public void deleteStaff(Integer staffId, Integer currentUserId) {
    Staff staff = staffRepository.findById(staffId)
        .orElseThrow(() -> new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND));

    User user = staff.getUser();
    if (user != null && user.getRole() == Role.SUPER_ADMIN) {
      throw new BusinessException("Süper Admin silinemez", HttpStatus.FORBIDDEN);
    }

    // Veritabanından tamamen sil (Hard Delete)
    staffRepository.delete(staff);
    if (user != null) {
      userRepository.delete(user);
    }

    auditLogService.log(currentUserId, "STAFF_DELETED", "STAFF", staffId,
        "Staff deleted: " + staff.getFullName());
  }
}