package com.velauto.entity;

import com.velauto.entity.enums.ServiceFormStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_forms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class ServiceForm {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(name = "appointment_id", nullable = true)
  private Integer appointmentId;

  @Column(name = "vehicle_id", nullable = false)
  private Integer vehicleId;

  @Column(name = "customer_id", nullable = false)
  private Integer customerId;

  @Column(name = "current_km", nullable = false)
  private Integer currentKm;

  @Column(name = "complaints", columnDefinition = "TEXT")
  private String complaints;

  @Column(name = "general_condition", columnDefinition = "TEXT")
  private String generalCondition;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private ServiceFormStatus status;

  @Builder.Default
  @Column(name = "total_amount", nullable = false, columnDefinition = "DECIMAL(10, 2)")
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Builder.Default
  @Column(name = "total_tax", nullable = false, columnDefinition = "DECIMAL(10, 2)")
  private BigDecimal totalTax = BigDecimal.ZERO;

  @Builder.Default
  @Column(name = "is_locked", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
  private Boolean isLocked = false;

  @Column(name = "tenant_id", nullable = false)
  private Integer tenantId;

  @Column(name = "created_by")
  private Integer createdBy;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_by")
  private Integer updatedBy;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @Column(name = "deleted_by")
  private Integer deletedBy;

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}

