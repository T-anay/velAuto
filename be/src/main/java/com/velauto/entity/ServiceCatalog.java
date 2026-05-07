package com.velauto.entity;

import com.velauto.entity.enums.CatalogItemType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "service_catalog")
public class ServiceCatalog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;


  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false)
  private CatalogItemType type;

  @Column(name = "code", nullable = false, length = 50, unique = true)
  private String code;

  @Column(name = "name", nullable = false, length = 100)
  private String name;

  @Column(name = "default_price", nullable = false, precision = 10, scale = 2)
  private BigDecimal defaultPrice;

  @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
  private BigDecimal taxRate;

  @Column(columnDefinition = "TEXT")
  private String description;


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
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}