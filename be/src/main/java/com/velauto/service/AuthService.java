package com.velauto.service;

import com.velauto.dto.AdminCreateDto;
import com.velauto.dto.AuthResponseDto;
import com.velauto.dto.ChangePasswordDto;
import com.velauto.dto.ForgotPasswordDto;
import com.velauto.dto.LoginDto;
import com.velauto.dto.RefreshTokenDto;
import com.velauto.dto.RegisterDto;
import com.velauto.dto.ResetPasswordDto;
import com.velauto.dto.StaffCreateDto;

public interface AuthService {

  AuthResponseDto register(RegisterDto request);

  AuthResponseDto login(LoginDto request);

  AuthResponseDto createAdmin(AdminCreateDto request, Integer currentUserId);

  AuthResponseDto createStaff(StaffCreateDto request, Integer currentUserId);

  void changePassword(ChangePasswordDto request, Integer currentUserId);

  void forgotPassword(ForgotPasswordDto request);

  void resetPassword(ResetPasswordDto request);

  AuthResponseDto refreshToken(RefreshTokenDto request);

  void logout(Integer currentUserId);
}



