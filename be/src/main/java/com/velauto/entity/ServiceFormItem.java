package com.velauto.entity;

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
@Table(name = "service_form_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class ServiceFormItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(name = "service_form_id", nullable = false)
  private Integer serviceFormId;

  @Column(name = "service_catalog_id", nullable = false)
  private Integer serviceCatalogId;

  @Column(name = "item_name", length = 100)
  private String itemName;

  @Column(name = "quantity", nullable = false)
  private Integer quantity;

  @Column(name = "unit_price", nullable = false, columnDefinition = "DECIMAL(10, 2)")
  private BigDecimal unitPrice;

  @Column(name = "tax_rate", columnDefinition = "DECIMAL(5, 2)")
  private BigDecimal taxRate;

  @Column(name = "line_total", nullable = false, columnDefinition = "DECIMAL(10, 2)")
  private BigDecimal lineTotal;


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