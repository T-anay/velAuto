package com.velauto.mapper;

import com.velauto.dto.CustomerCreateDto;
import com.velauto.dto.CustomerResponseDto;
import com.velauto.dto.CustomerUpdateDto;
import com.velauto.entity.Customer;
import com.velauto.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

  /**
   * CustomerCreateDto ve User'dan Customer oluşturur
   * - Identity: firstName, lastName, phone, email kullanıcıdan alındı (SSOT)
   * - Commercial: address, taxNumber, companyName vb. DTO'dan alınır
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", source = "user")
  @Mapping(target = "address", source = "request.address")
  @Mapping(target = "taxNumber", source = "request.taxNumber")
  @Mapping(target = "taxOffice", source = "request.taxOffice")
  @Mapping(target = "companyName", source = "request.companyName")
  @Mapping(target = "customerType", source = "request.customerType")
  @Mapping(target = "discountRate", source = "request.discountRate")
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  Customer toCustomer(CustomerCreateDto request, User user);

  /**
   * CustomerUpdateDto'ten Customer'ı günceller
   * - Identity alanları User tarafında güncellenebilir
   * - Sadece commercial alanları burada güncellenir
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "deletedAt", ignore = true)
  @Mapping(target = "deletedBy", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  void updateCustomer(CustomerUpdateDto request, @MappingTarget Customer customer);

  /**
   * Customer'dan CustomerResponseDto oluşturur
   * - Identity: User entity'sinden firstName, lastName, phone, email alınır
   * - Commercial: Customer entity'sinden address, taxNumber vb. alınır
   */
  @Mapping(target = "id", source = "customer.id")
  @Mapping(target = "userId", source = "customer.user.id")
  @Mapping(target = "firstName", source = "customer.user.firstName")
  @Mapping(target = "lastName", source = "customer.user.lastName")
  @Mapping(target = "phone", source = "customer.user.phone")
  @Mapping(target = "email", source = "customer.user.email")
  @Mapping(target = "address", source = "customer.address")
  @Mapping(target = "taxNumber", source = "customer.taxNumber")
  @Mapping(target = "taxOffice", source = "customer.taxOffice")
  @Mapping(target = "companyName", source = "customer.companyName")
  @Mapping(target = "customerType", source = "customer.customerType", qualifiedByName = "enumToString")
  @Mapping(target = "discountRate", source = "customer.discountRate")
  @Mapping(target = "createdAt", source = "customer.createdAt")
  @Mapping(target = "updatedAt", source = "customer.updatedAt")
  CustomerResponseDto toCustomerResponse(Customer customer);

  /**
   * Enum'u String'e çevir (DTO transmission için)
   */
  @Named("enumToString")
  default String enumToString(Object enumValue) {
    return enumValue != null ? enumValue.toString() : null;
  }
}

