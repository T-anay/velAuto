package com.velauto.dto;

import com.velauto.constant.Messages;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceFormCreateDto {

  private Integer appointmentId;

  @NotNull(message = Messages.SERVICE_FORM_VEHICLE_ID_REQUIRED)
  private Integer vehicleId;

  // Hızlı kayıt için müşteri ID'si ve KM zorunluluğunu kaldırıyoruz
  private Integer customerId;
  private Integer currentKm;

  // React'ten gelen ismi karşılaması için alan adını "description" yaptık
  @Size(max = 2000, message = Messages.SERVICE_FORM_COMPLAINTS_SIZE)
  private String description;

  // complaints olarak kullanmaya devam etmek istersen yukarıdaki "description"ı silip bunu aktif edebilirsin
  // Ancak bu durumda React tarafını değiştirmen gerekir. Biz React'i ellemeden Java'yı uyumluyoruz.

  @Size(max = 2000, message = Messages.SERVICE_FORM_CONDITION_SIZE)
  private String generalCondition;

  // React'ten gelen statüyü yakalayabilmek için eklendi
  private String status;
}