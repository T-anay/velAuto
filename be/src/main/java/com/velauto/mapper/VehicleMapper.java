package com.velauto.mapper;

import com.velauto.dto.VehicleCreateDto;
import com.velauto.dto.VehicleResponseDto;
import com.velauto.dto.VehicleUpdateDto;
import com.velauto.dto.VehicleWithHistoryDto;
import com.velauto.entity.*;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {CustomerMapper.class, StaffMapper.class})
public interface VehicleMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "customer", source = "customer")
  @Mapping(target = "licensePlate", source = "request.licensePlate")

  // Sadeleştirme: DTO'dan kestiğimiz detay alanlarını artık yoksayıyoruz
  @Mapping(target = "year", ignore = true)
  @Mapping(target = "chassisNumber", ignore = true)
  @Mapping(target = "color", ignore = true)
  @Mapping(target = "odometer", ignore = true)

  @Mapping(target = "brand", source = "brand")
  @Mapping(target = "vehicleModel", source = "vehicleModel")
  @Mapping(target = "assignedStaff", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  Vehicle toVehicle(
          VehicleCreateDto request,
          Customer customer,
          Brand brand,
          VehicleModel vehicleModel);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "brand", ignore = true)
  @Mapping(target = "vehicleModel", ignore = true)
  @Mapping(target = "assignedStaff", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  void updateVehicle(VehicleUpdateDto request, @MappingTarget Vehicle vehicle, Customer customer);

  @Mapping(target = "customerId", source = "vehicle.customer.id")
  @Mapping(target = "customerFullName", expression = "java(buildFullName(vehicle))")
  @Mapping(target = "assignedStaffId", source = "vehicle.assignedStaff.id")
  @Mapping(target = "assignedStaffName", source = "vehicle.assignedStaff.fullName")
  @Mapping(target = "brandId", source = "vehicle.brand.id")
  @Mapping(target = "brandName", source = "vehicle.brand.name")
  @Mapping(target = "modelId", source = "vehicle.vehicleModel.id")
  @Mapping(target = "modelName", source = "vehicle.vehicleModel.name")
  VehicleResponseDto toVehicleResponse(Vehicle vehicle);

  @Mapping(target = "customerId", source = "vehicle.customer.id")
  @Mapping(target = "customerFullName", expression = "java(buildFullName(vehicle))")
  @Mapping(target = "customerPhone", source = "vehicle.customer.user.phone")
  @Mapping(target = "assignedStaffId", source = "vehicle.assignedStaff.id")
  @Mapping(target = "assignedStaffName", source = "vehicle.assignedStaff.fullName")
  @Mapping(target = "brandId", source = "vehicle.brand.id")
  @Mapping(target = "brandName", source = "vehicle.brand.name")
  @Mapping(target = "modelId", source = "vehicle.vehicleModel.id")
  @Mapping(target = "modelName", source = "vehicle.vehicleModel.name")
  @Mapping(target = "serviceHistory", ignore = true)
  @Mapping(target = "appointmentHistory", ignore = true)
  VehicleWithHistoryDto toVehicleWithHistoryResponse(Vehicle vehicle);

  /**
   * User entity'sinden full name oluştur (firstName + lastName)
   */
  default String buildFullName(Vehicle vehicle) {
    if (vehicle == null || vehicle.getCustomer() == null || vehicle.getCustomer().getUser() == null) {
      return "N/A";
    }
    String first = vehicle.getCustomer().getUser().getFirstName() != null ?
            vehicle.getCustomer().getUser().getFirstName() : "";
    String last = vehicle.getCustomer().getUser().getLastName() != null ?
            vehicle.getCustomer().getUser().getLastName() : "";
    return (first + " " + last).trim();
  }
}