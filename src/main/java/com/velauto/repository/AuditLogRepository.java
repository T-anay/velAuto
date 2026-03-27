package com.velauto.repository;

import com.velauto.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

  List<AuditLog> findByUserId(Integer userId);

  List<AuditLog> findByEntityTypeAndEntityId(String entityType, Integer entityId);

  List<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

