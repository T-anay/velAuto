package com.velauto.controller;

import com.velauto.dto.ChangePasswordDto;
import com.velauto.dto.UserProfileDto;
import com.velauto.dto.UserProfileUpdateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  public ResponseEntity<UserProfileDto> getMyProfile(
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    UserProfileDto profile = userService.getMyProfile(userDetails.getUserId(), userDetails.getTenantId());
    return ResponseEntity.ok(profile);
  }

  @PutMapping("/profile")
  public ResponseEntity<UserProfileDto> updateMyProfile(
      @Valid @RequestBody UserProfileUpdateDto dto,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    UserProfileDto updated = userService.updateMyProfile(
        userDetails.getUserId(),
        userDetails.getTenantId(),
        dto
    );
    return ResponseEntity.ok(updated);
  }

  @PutMapping("/change-password")
  public ResponseEntity<Void> changePassword(
      @Valid @RequestBody ChangePasswordDto dto,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    userService.changeMyPassword(userDetails.getUserId(), userDetails.getTenantId(), dto);
    return ResponseEntity.noContent().build();
  }
}

