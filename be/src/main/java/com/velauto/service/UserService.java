package com.velauto.service;

public interface UserService {

  com.velauto.dto.UserProfileDto getMyProfile(Integer userId);

  com.velauto.dto.UserProfileDto updateMyProfile(Integer userId, com.velauto.dto.UserProfileUpdateDto dto);

  void changeMyPassword(Integer userId, com.velauto.dto.ChangePasswordDto dto);
}

