package com.velauto.service.impl;

import com.velauto.dto.ChangePasswordDto;
import com.velauto.dto.UserProfileDto;
import com.velauto.dto.UserProfileUpdateDto;
import com.velauto.entity.User;
import com.velauto.exception.BusinessException;
import com.velauto.repository.UserRepository;
import com.velauto.service.UserService;
import com.velauto.utility.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public UserProfileDto getMyProfile(Integer userId, Integer tenantId) {
    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new BusinessException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));

    if (!isSameTenant(user.getTenantId(), tenantId)) {
      throw new BusinessException("Erişim reddedildi: Farklı tenant", HttpStatus.FORBIDDEN);
    }

    return UserProfileDto.builder()
        .id(user.getId())
        .firstName(user.getFirstName())
        .lastName(user.getLastName())
        .email(user.getEmail())
        .phone(user.getPhone())
        .role(user.getRole().toString())
        .tenantId(user.getTenantId())
        .createdAt(user.getCreatedAt())
        .build();
  }

  @Override
  @Transactional
  public UserProfileDto updateMyProfile(Integer userId, Integer tenantId, UserProfileUpdateDto dto) {
    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new BusinessException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));

    if (!isSameTenant(user.getTenantId(), tenantId)) {
      throw new BusinessException("Erişim reddedildi: Farklı tenant", HttpStatus.FORBIDDEN);
    }

    if (dto.getFirstName() != null && !dto.getFirstName().isBlank()) {
      user.setFirstName(dto.getFirstName());
    }

    if (dto.getLastName() != null && !dto.getLastName().isBlank()) {
      user.setLastName(dto.getLastName());
    }

    if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
      String normalizedPhone;
      try {
        normalizedPhone = PhoneUtils.normalize(dto.getPhone());
      } catch (IllegalArgumentException e) {
        throw new BusinessException("Geçersiz telefon numarası: " + e.getMessage(), HttpStatus.BAD_REQUEST);
      }
      user.setPhone(normalizedPhone);
    }

    user.setUpdatedAt(LocalDateTime.now());
    User updatedUser = userRepository.save(user);

    return UserProfileDto.builder()
        .id(updatedUser.getId())
        .firstName(updatedUser.getFirstName())
        .lastName(updatedUser.getLastName())
        .email(updatedUser.getEmail())
        .phone(updatedUser.getPhone())
        .role(updatedUser.getRole().toString())
        .tenantId(updatedUser.getTenantId())
        .createdAt(updatedUser.getCreatedAt())
        .build();
  }

  @Override
  @Transactional
  public void changeMyPassword(Integer userId, Integer tenantId, ChangePasswordDto dto) {
    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new BusinessException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));

    if (!isSameTenant(user.getTenantId(), tenantId)) {
      throw new BusinessException("Erişim reddedildi: Farklı tenant", HttpStatus.FORBIDDEN);
    }

    if (!passwordEncoder.matches(dto.getOldPassword(), user.getPasswordHash())) {
      throw new BusinessException("Eski şifre yanlış", HttpStatus.UNAUTHORIZED);
    }

    if (!dto.getNewPassword().equals(dto.getNewPasswordConfirm())) {
      throw new BusinessException("Yeni şifreler uyuşmuyor", HttpStatus.BAD_REQUEST);
    }

    if (passwordEncoder.matches(dto.getNewPassword(), user.getPasswordHash())) {
      throw new BusinessException("Yeni şifre eski şifre ile aynı olamaz", HttpStatus.BAD_REQUEST);
    }

    String encodedNewPassword = passwordEncoder.encode(dto.getNewPassword());
    user.setPasswordHash(encodedNewPassword);
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);
  }

  private boolean isSameTenant(Integer userTenant, Integer contextTenant) {
    if (contextTenant == null) {
      return true;
    }
    return userTenant != null && userTenant.equals(contextTenant);
  }
}

