package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.AdminCreateDto;
import com.velauto.dto.AuthResponseDto;
import com.velauto.dto.ChangePasswordDto;
import com.velauto.dto.ForgotPasswordDto;
import com.velauto.dto.LoginDto;
import com.velauto.dto.RefreshTokenDto;
import com.velauto.dto.RegisterDto;
import com.velauto.dto.ResetPasswordDto;
import com.velauto.dto.StaffCreateDto;
import com.velauto.entity.Customer;
import com.velauto.entity.PasswordResetToken;
import com.velauto.entity.RefreshToken;
import com.velauto.entity.Staff;
import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.AuthMapper;
import com.velauto.mapper.CustomerMapper;
import com.velauto.mapper.StaffMapper;
import com.velauto.mapper.UserMapper;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.PasswordResetTokenRepository;
import com.velauto.repository.RefreshTokenRepository;
import com.velauto.repository.StaffRepository;
import com.velauto.repository.UserRepository;
import com.velauto.security.JwtUtils;
import com.velauto.service.AuditLogService;
import com.velauto.service.AuthService;
import com.velauto.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final CustomerRepository customerRepository;
  private final StaffRepository staffRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtils jwtUtils;
  private final RefreshTokenService refreshTokenService;
  private final AuditLogService auditLogService;
  private final AuthenticationManager authenticationManager;

  private final UserMapper userMapper;
  private final CustomerMapper customerMapper;
  private final StaffMapper staffMapper;
  private final AuthMapper authMapper;

  private User findActiveUserById(Integer userId) {
    Optional<User> userOptional = userRepository.findByIdAndDeletedAtIsNull(userId);
    if (userOptional.isEmpty()) {
      throw new BusinessException(Messages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }
    return userOptional.get();
  }

  private void validateEmailNotExists(String email) {
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(Messages.EMAIL_ALREADY_EXISTS);
    }
  }

  private void validatePasswordsMatch(String password, String confirmPassword) {
    if (!password.equals(confirmPassword)) {
      throw new BusinessException(Messages.PASSWORDS_DO_NOT_MATCH);
    }
  }

  private void validateUserHasRole(User user, Role... allowedRoles) {
    boolean hasPermission = false;
    for (Role allowedRole : allowedRoles) {
      if (user.getRole() == allowedRole) {
        hasPermission = true;
        break;
      }
    }
    if (!hasPermission) {
      throw new BusinessException(Messages.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN);
    }
  }

  private AuthResponseDto createAuthResponse(User user) {
    String accessToken = jwtUtils.generateToken(user.getEmail());
    RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
    return authMapper.toAuthResponse(user, accessToken, refreshToken);
  }

  @Override
  @Transactional
  public AuthResponseDto register(RegisterDto request) {
    validatePasswordsMatch(request.getPassword(), request.getConfirmPassword());
    validateEmailNotExists(request.getEmail());

    String encodedPassword = passwordEncoder.encode(request.getPassword());
    User user = userMapper.toCustomerUser(request, encodedPassword);
    User savedUser = userRepository.save(user);

    Customer customer = new Customer();
    customer.setUser(savedUser);
    customer.setAddress(request.getAddress());
    customer.setCompanyName(request.getCompanyName());
    customer.setCustomerType(com.velauto.entity.enums.CustomerType.INDIVIDUAL);
    customer.setDiscountRate(java.math.BigDecimal.ZERO);
    customerRepository.save(customer);

    AuthResponseDto response = createAuthResponse(savedUser);
    auditLogService.log(savedUser.getId(), "USER_REGISTERED", "USER", savedUser.getId());

    return response;
  }

  @Override
  @Transactional
  public AuthResponseDto login(LoginDto request) {
    String email = request.getEmail();
    Optional<User> userOptional = userRepository.findByEmail(email);

    if (userOptional.isEmpty()) {
      throw new BusinessException(Messages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    User user = userOptional.get();

    if (user.getDeletedAt() != null) {
      throw new BusinessException(Messages.USER_DELETED, HttpStatus.UNAUTHORIZED);
    }

    if (!user.isActive()) {
      throw new BusinessException(Messages.USER_INACTIVE, HttpStatus.UNAUTHORIZED);
    }

    String password = request.getPassword();
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new BusinessException(Messages.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
    }

    authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password)
    );

    RefreshToken refreshToken = refreshTokenService.createOrRotate(user);
    String accessToken = jwtUtils.generateToken(user.getEmail());
    AuthResponseDto response = authMapper.toAuthResponse(user, accessToken, refreshToken);

    auditLogService.log(user.getId(), "USER_LOGGED_IN", "USER", user.getId());

    return response;
  }

  @Override
  @Transactional
  public AuthResponseDto createAdmin(AdminCreateDto request, Integer currentUserId) {
    User currentUser = findActiveUserById(currentUserId);
    validateUserHasRole(currentUser, Role.SUPER_ADMIN); // DÜZELTİLDİ

    String email = request.getEmail();
    validateEmailNotExists(email);

    String encodedPassword = passwordEncoder.encode(request.getPassword());
    User adminUser = userMapper.toAdminUser(request, encodedPassword, currentUserId);
    User savedAdmin = userRepository.save(adminUser);

    AuthResponseDto response = createAuthResponse(savedAdmin);
    String auditDetails = "Created by super admin: " + currentUser.getEmail();
    auditLogService.log(currentUserId, "ADMIN_CREATED", "USER", savedAdmin.getId(), auditDetails);

    return response;
  }

  @Override
  @Transactional
  public AuthResponseDto createStaff(StaffCreateDto request, Integer currentUserId) {
    User currentUser = findActiveUserById(currentUserId);
    validateUserHasRole(currentUser, Role.ADMIN, Role.SUPER_ADMIN); // DÜZELTİLDİ

    String email = request.getEmail();
    validateEmailNotExists(email);

    String encodedPassword = passwordEncoder.encode(request.getPassword());

    User staffUser = userMapper.toStaffUser(request, encodedPassword, currentUserId);
    User savedStaffUser = userRepository.save(staffUser);

    Staff staff = staffMapper.toStaff(request, savedStaffUser);
    staffRepository.save(staff);

    AuthResponseDto response = createAuthResponse(savedStaffUser);
    String auditDetails = "Staff created: " + request.getFullName();
    auditLogService.log(currentUserId, "STAFF_CREATED", "USER", savedStaffUser.getId(), auditDetails);

    return response;
  }

  @Override
  @Transactional
  public void changePassword(ChangePasswordDto request, Integer currentUserId) {
    User currentUser = findActiveUserById(currentUserId);

    if (!passwordEncoder.matches(request.getOldPassword(), currentUser.getPasswordHash())) {
      throw new BusinessException(Messages.OLD_PASSWORD_INCORRECT);
    }

    validatePasswordsMatch(request.getNewPassword(), request.getNewPasswordConfirm());

    String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
    currentUser.setPasswordHash(encodedNewPassword);
    currentUser.setUpdatedBy(currentUserId);
    currentUser.setUpdatedAt(LocalDateTime.now());
    userRepository.save(currentUser);

    auditLogService.log(currentUserId, "PASSWORD_CHANGED", "USER", currentUserId);
  }

  @Override
  @Transactional
  public void forgotPassword(ForgotPasswordDto request) {
    String email = request.getEmail();
    Optional<User> userOptional = userRepository.findByEmail(email);

    if (userOptional.isEmpty()) {
      log.warn("Şifre sıfırlama talebi - kullanıcı bulunamadı: email={}", email);
      return;
    }

    User user = userOptional.get();
    passwordResetTokenRepository.deleteByUserAndUsedFalse(user);

    String tokenValue = UUID.randomUUID().toString();
    Instant expiryDate = Instant.now().plus(1, ChronoUnit.HOURS);

    PasswordResetToken resetToken = new PasswordResetToken();
    resetToken.setToken(tokenValue);
    resetToken.setUser(user);
    resetToken.setExpiryDate(expiryDate);
    resetToken.setUsed(false);
    passwordResetTokenRepository.save(resetToken);

    auditLogService.log(user.getId(), "PASSWORD_RESET_REQUESTED", "USER", user.getId());
  }

  @Override
  @Transactional
  public void resetPassword(ResetPasswordDto request) {
    String tokenValue = request.getToken();
    Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByTokenAndUsedFalse(tokenValue);

    if (tokenOptional.isEmpty()) {
      throw new BusinessException(Messages.INVALID_RESET_TOKEN);
    }

    PasswordResetToken resetToken = tokenOptional.get();

    if (resetToken.isUsed()) {
      throw new BusinessException(Messages.RESET_TOKEN_USED);
    }

    if (resetToken.getExpiryDate().isBefore(Instant.now())) {
      throw new BusinessException(Messages.RESET_TOKEN_EXPIRED);
    }

    validatePasswordsMatch(request.getNewPassword(), request.getConfirmNewPassword());

    User user = resetToken.getUser();
    String encodedPassword = passwordEncoder.encode(request.getNewPassword());
    user.setPasswordHash(encodedPassword);
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);

    resetToken.setUsed(true);
    passwordResetTokenRepository.save(resetToken);

    auditLogService.log(user.getId(), "PASSWORD_RESET_COMPLETED", "USER", user.getId());
  }

  @Override
  @Transactional
  public AuthResponseDto refreshToken(RefreshTokenDto request) {
    String tokenValue = request.getRefreshToken();
    Optional<RefreshToken> tokenOptional = refreshTokenRepository.findByToken(tokenValue);

    if (tokenOptional.isEmpty()) {
      throw new BusinessException(Messages.REFRESH_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
    }

    RefreshToken refreshToken = tokenOptional.get();
    RefreshToken verifiedToken = refreshTokenService.verifyExpiration(refreshToken);
    User user = verifiedToken.getUser();

    String newAccessToken = jwtUtils.generateToken(user.getEmail());
    AuthResponseDto response = authMapper.toAuthResponse(user, newAccessToken, verifiedToken);

    return response;
  }

  @Override
  @Transactional
  public void logout(Integer currentUserId) {
    User currentUser = findActiveUserById(currentUserId);
    refreshTokenRepository.deleteByUser(currentUser);
    auditLogService.log(currentUserId, "USER_LOGGED_OUT", "USER", currentUserId);
  }
}