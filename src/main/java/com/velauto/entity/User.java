package com.velauto.entity;

import com.velauto.entity.enums.Role;
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
@Table(name = "users", uniqueConstraints = {
  @UniqueConstraint(name = "uk_users_tenant_phone", columnNames = {"tenant_id", "phone"})
})
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true, length = 100)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, columnDefinition = "ENUM('super_admin', 'admin', 'staff', 'customer') DEFAULT 'customer'")
  private Role role = Role.customer;

  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @Column(name = "created_by")
  private Integer createdBy;

  @Column(name = "tenant_id")
  private Integer tenantId;

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

  @Column(name = "first_name", length = 100)
  private String firstName;

  @Column(name = "last_name", length = 100)
  private String lastName;

  // Tenant-scoped unique phone, stored in normalized canonical format.
  @Column(nullable = false, length = 20)
  private String phone;

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}