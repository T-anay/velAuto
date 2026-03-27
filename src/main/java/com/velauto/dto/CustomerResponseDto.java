package com.velauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDto {

  private Integer id;

  // Identity fields (from User)
  private Integer userId;
  private String firstName;
  private String lastName;
  private String phone;
  private String email;

  // Commercial fields (from Customer)
  private String address;
  private String taxNumber;
  private String taxOffice;
  private String companyName;
  private String customerType; // INDIVIDUAL | CORPORATE
  private BigDecimal discountRate;

  // Metadata
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}


