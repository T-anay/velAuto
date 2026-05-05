package com.velauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleWithHistoryDto {

  private Integer id;

  private String licensePlate;

  private Integer year;

  private String chassisNumber;

  private String color;

  private Integer odometer;

  // Customer bilgisi
  private Integer customerId;
  private String customerFullName;
  private String customerPhone;

  // Staff assignment
  private Integer assignedStaffId;
  private String assignedStaffName;

  // Marka ve Model
  private Integer brandId;
  private String brandName;
  private Integer modelId;
  private String modelName;

  // Geçmiş Bilgileri
  private List<ServiceFormHistoryDto> serviceHistory;
  private List<AppointmentHistoryDto> appointmentHistory;

  // Metadata
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  /**
   * Bakım Formu Geçmişi
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ServiceFormHistoryDto {
    private Integer id;
    private String complaint;
    private String diagnosis;
    private Integer odometer;
    private String status;
    private LocalDateTime entryDate;
    private LocalDateTime exitDate;
    private String staffName;
  }

  /**
   * Randevu Geçmişi
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AppointmentHistoryDto {
    private Integer id;
    private LocalDateTime appointmentDate;
    private String status;
    private String customerNote;
    private String staffNote;
  }
}


