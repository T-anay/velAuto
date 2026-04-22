package com.velauto.controller;

import com.velauto.dto.AdminCreateDto;
import com.velauto.dto.AuthResponseDto;
import com.velauto.dto.ChangePasswordDto;
import com.velauto.dto.ForgotPasswordDto;
import com.velauto.dto.LoginDto;
import com.velauto.dto.RefreshTokenDto;
import com.velauto.dto.RegisterDto;
import com.velauto.dto.ResetPasswordDto;
import com.velauto.dto.StaffCreateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register")
  public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterDto request) {
    AuthResponseDto response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginDto request) {
    AuthResponseDto response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/admin/create")
  public ResponseEntity<AuthResponseDto> createAdmin(
      @Valid @RequestBody AdminCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Integer currentUserId = userDetails.getUserId();
    AuthResponseDto response = authService.createAdmin(request, currentUserId);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/staff/create")
  public ResponseEntity<AuthResponseDto> createStaff(
      @Valid @RequestBody StaffCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Integer currentUserId = userDetails.getUserId();
    AuthResponseDto response = authService.createStaff(request, currentUserId);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/change-password")
  public ResponseEntity<Map<String, String>> changePassword(
      @Valid @RequestBody ChangePasswordDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Integer currentUserId = userDetails.getUserId();
    authService.changePassword(request, currentUserId);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Şifreniz başarıyla değiştirildi");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<Map<String, String>> forgotPassword(
      @Valid @RequestBody ForgotPasswordDto request) {
    authService.forgotPassword(request);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Map<String, String>> resetPassword(
      @Valid @RequestBody ResetPasswordDto request) {
    authService.resetPassword(request);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Şifreniz başarıyla sıfırlandı");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponseDto> refreshToken(
      @Valid @RequestBody RefreshTokenDto request) {
    AuthResponseDto response = authService.refreshToken(request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/logout")
  public ResponseEntity<Map<String, String>> logout(
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Integer currentUserId = userDetails.getUserId();
    authService.logout(currentUserId);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Başarıyla çıkış yapıldı");

    return ResponseEntity.ok(response);
  }
}


