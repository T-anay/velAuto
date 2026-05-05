package com.velauto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vehicles")
public class Vehicle {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @ManyToOne(optional = true)
  @JoinColumn(name = "customer_id", nullable = true)
  private Customer customer;

  // HATA BURADAYDI: name = "plate" yerine name = "license_plate" yapıldı.
  @Column(name = "plate", nullable = false, unique = true, length = 20)
  private String licensePlate;

  @Column(name = "production_year")
  private Integer year;

  @Column(name = "chassis_number", unique = true, length = 50)
  private String chassisNumber;

  @Column(length = 30)
  private String color;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @ManyToOne
  @JoinColumn(name = "brand_id", nullable = false)
  private Brand brand;

  @ManyToOne
  @JoinColumn(name = "model_id", nullable = false)
  private VehicleModel vehicleModel;

  // FUTURE NOTE: Staff atama kontrolü için VehicleServiceImpl'deki assignStaff() metodunu güncelleyin
  // STAFF ve ADMIN rolleri bu methodu kullanabilir
  @ManyToOne(optional = true)
  @JoinColumn(name = "assigned_staff_id", nullable = true)
  private Staff assignedStaff;

  // Kilometre bilgisi - opsiyonel, ServiceForm entry_date sırasında güncellenir
  @Column(name = "odometer", nullable = true)
  private Integer odometer;

  // Soft Delete Alanları - FUTURE NOTE: Silinmiş kayıtlar listelenmemelidir
  // VehicleRepository sorgularında deleted_at IS NULL filtresi kullanılır
  @Column(name = "updated_by")
  private Integer updatedBy;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @Column(name = "deleted_by")
  private Integer deletedBy;

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}