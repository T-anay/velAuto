package com.velauto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(name = "user_id")
  private Integer userId;

  @Column(nullable = false, length = 100)
  private String action; // Örn: USER_REGISTERED, USER_LOGGED_IN, ADMIN_CREATED

  @Column(name = "entity_type", length = 50)
  private String entityType; // Örn: USER, CUSTOMER, STAFF

  @Column(name = "entity_id")
  private Integer entityId;

  @Column(columnDefinition = "TEXT")
  private String details;

  @CreationTimestamp
  @Column(name = "created_at")
  private LocalDateTime createdAt;
}