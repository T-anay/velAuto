package com.velauto.entity;

import com.velauto.entity.enums.CustomerType;
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
@Table(name = "customers")
public class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @OneToOne
  @JoinColumn(name = "user_id", referencedColumnName = "id")
  private User user;

  @Column(columnDefinition = "TEXT")
  private String address;

  @Column(name = "tax_number", length = 50)
  private String taxNumber;

  @Column(name = "tax_office", length = 100)
  private String taxOffice;

  @Column(name = "company_name", length = 100)
  private String companyName;

  @Enumerated(EnumType.STRING)
  @Column(name = "customer_type", nullable = false)
  private CustomerType customerType = CustomerType.INDIVIDUAL;

  @Column(name = "discount_rate", nullable = false, precision = 5, scale = 2)
  private BigDecimal discountRate = BigDecimal.ZERO;

  @Column(name = "updated_by")
  private Integer updatedBy;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @Column(name = "deleted_by")
  private Integer deletedBy;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}