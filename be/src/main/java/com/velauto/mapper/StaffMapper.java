package com.velauto.mapper;

import com.velauto.dto.StaffCreateDto;
import com.velauto.dto.StaffResponseDto;
import com.velauto.entity.Staff;
import com.velauto.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StaffMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", source = "user")
  @Mapping(target = "fullName", source = "request.fullName")
  @Mapping(target = "phone", source = "request.phone")
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  Staff toStaff(StaffCreateDto request, User user);

  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "email", source = "user.email")
  @Mapping(target = "role", expression = "java(staff.getUser() != null && staff.getUser().getRole() != null ? staff.getUser().getRole().name() : null)")
  @Mapping(target = "active", expression = "java(staff.getUser() != null && staff.getUser().isActive())")
  StaffResponseDto toResponseDto(Staff staff);
}


