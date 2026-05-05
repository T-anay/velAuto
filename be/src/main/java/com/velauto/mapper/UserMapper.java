package com.velauto.mapper;

import com.velauto.dto.AdminCreateDto;
import com.velauto.dto.RegisterDto;
import com.velauto.dto.StaffCreateDto;
import com.velauto.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

  /**
   * RegisterDto'ten Customer User oluşturur
   * RegisterDto: fullName (ad soyad), phone, email
   * User: firstName, lastName, phone, email
   * @param request RegisterDto DTO
   * @param encodedPassword Şifrelenmiş şifre
   * @return Customer User entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "email", source = "request.email")
  @Mapping(target = "firstName", source = "request.fullName", qualifiedByName = "extractFirstName")
  @Mapping(target = "lastName", source = "request.fullName", qualifiedByName = "extractLastName")
  @Mapping(target = "phone", source = "request.phone")
  @Mapping(target = "passwordHash", source = "encodedPassword")
  @Mapping(target = "role", constant = "CUSTOMER") // DÜZELTİLDİ
  @Mapping(target = "active", constant = "true")
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "tenantId", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  User toCustomerUser(RegisterDto request, String encodedPassword);

  /**
   * AdminCreateDto'ten Admin User oluşturur
   * AdminCreateDto: email, password, fullName
   * @param request AdminCreateDto DTO
   * @param encodedPassword Şifrelenmiş şifre
   * @param createdBy Oluşturan kullanıcı ID
   * @param tenantId Tenant ID
   * @return Admin User entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "email", source = "request.email")
  @Mapping(target = "firstName", source = "request.fullName", qualifiedByName = "extractFirstName")
  @Mapping(target = "lastName", source = "request.fullName", qualifiedByName = "extractLastName")
  @Mapping(target = "phone", ignore = true)
  @Mapping(target = "passwordHash", source = "encodedPassword")
  @Mapping(target = "role", constant = "ADMIN") // DÜZELTİLDİ
  @Mapping(target = "active", constant = "true")
  @Mapping(target = "createdBy", source = "createdBy")
  @Mapping(target = "tenantId", source = "tenantId")
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  User toAdminUser(AdminCreateDto request, String encodedPassword, Integer createdBy, Integer tenantId);

  /**
   * StaffCreateDto'ten Staff User oluşturur
   * StaffCreateDto: fullName, phone, email, password, title
   * @param request StaffCreateDto DTO
   * @param encodedPassword Şifrelenmiş şifre
   * @param createdBy Oluşturan kullanıcı ID
   * @param tenantId Tenant ID
   * @return Staff User entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "email", source = "request.email")
  @Mapping(target = "firstName", source = "request.fullName", qualifiedByName = "extractFirstName")
  @Mapping(target = "lastName", source = "request.fullName", qualifiedByName = "extractLastName")
  @Mapping(target = "phone", source = "request.phone")
  @Mapping(target = "passwordHash", source = "encodedPassword")
  @Mapping(target = "role", constant = "STAFF") // DÜZELTİLDİ
  @Mapping(target = "active", constant = "true")
  @Mapping(target = "createdBy", source = "createdBy")
  @Mapping(target = "tenantId", source = "tenantId")
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  User toStaffUser(StaffCreateDto request, String encodedPassword, Integer createdBy, Integer tenantId);

  /**
   * Ad-Soyad ayrışma: "John Doe" -> "John"
   */
  @Named("extractFirstName")
  default String extractFirstName(String fullName) {
    if (fullName == null || fullName.isBlank()) {
      return null;
    }
    String trimmed = fullName.trim();
    int spaceIndex = trimmed.indexOf(' ');
    return spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed;
  }

  /**
   * Ad-Soyad ayrışma: "John Doe" -> "Doe"
   */
  @Named("extractLastName")
  default String extractLastName(String fullName) {
    if (fullName == null || fullName.isBlank()) {
      return null;
    }
    String trimmed = fullName.trim();
    int spaceIndex = trimmed.indexOf(' ');
    return spaceIndex > 0 ? trimmed.substring(spaceIndex + 1) : "";
  }
}