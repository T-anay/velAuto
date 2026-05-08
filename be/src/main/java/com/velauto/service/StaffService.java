package com.velauto.service;

import com.velauto.dto.AuthResponseDto;
import com.velauto.dto.StaffCreateDto;
import com.velauto.dto.StaffResponseDto;
import com.velauto.dto.StaffUpdateDto;

import java.util.List;

public interface StaffService {

  StaffResponseDto createStaff(StaffCreateDto request, Integer currentUserId);

  List<StaffResponseDto> getAllStaff();

  StaffResponseDto updateStaff(Integer staffId, StaffUpdateDto request, Integer currentUserId);

  void deleteStaff(Integer staffId, Integer currentUserId);
}
