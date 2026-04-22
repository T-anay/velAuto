package com.velauto.service;

import com.velauto.dto.AssignStaffDto;
import com.velauto.dto.VehicleCreateDto;
import com.velauto.dto.VehicleResponseDto;
import com.velauto.dto.VehicleUpdateDto;
import com.velauto.dto.VehicleWithHistoryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VehicleService {

  VehicleResponseDto createVehicle(VehicleCreateDto request, Integer currentUserId);

  VehicleResponseDto updateVehicle(Integer vehicleId, VehicleUpdateDto request, Integer currentUserId);

  VehicleResponseDto getVehicleById(Integer vehicleId);

  VehicleResponseDto getByLicensePlate(String licensePlate);

  VehicleWithHistoryDto getVehicleWithHistory(String licensePlate);

  Page<VehicleResponseDto> getVehiclesByCustomer(Integer customerId, Pageable pageable);

  Page<VehicleResponseDto> getAssignedVehicles(Integer staffId, Pageable pageable);

  Page<VehicleResponseDto> getAllVehicles(Integer tenantId, Pageable pageable);

  VehicleResponseDto assignStaff(Integer vehicleId, AssignStaffDto request, Integer currentUserId);

  void deleteVehicle(Integer vehicleId, Integer currentUserId);
}


