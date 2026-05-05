package com.velauto.service;

public interface UserService {

  com.velauto.dto.UserProfileDto getMyProfile(Integer userId, Integer tenantId);

  com.velauto.dto.UserProfileDto updateMyProfile(Integer userId, Integer tenantId, com.velauto.dto.UserProfileUpdateDto dto);

  void changeMyPassword(Integer userId, Integer tenantId, com.velauto.dto.ChangePasswordDto dto);
}

