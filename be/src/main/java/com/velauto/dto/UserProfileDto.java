package com.velauto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

  private Integer id;

  @NotBlank(message = "Ad bos birakilamaz")
  private String firstName;

  @NotBlank(message = "Soyad bos birakilamaz")
  private String lastName;

  @NotBlank(message = "Email bos birakilamaz")
  private String email;

  @NotBlank(message = "Telefon numarasi bos birakilamaz")
  private String phone;

  private String role;

  private Integer tenantId;

  private java.time.LocalDateTime createdAt;
}

