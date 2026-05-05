package com.velauto.service.impl;

import com.velauto.entity.AuditLog;
import com.velauto.repository.AuditLogRepository;
import com.velauto.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.apache.commons.text.StringEscapeUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

  private final AuditLogRepository auditLogRepository;

  @Override
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public void log(Integer userId, String action, String entityType, Integer entityId, String details) {
    try {
      // AuditLog nesnesi oluştur
      AuditLog auditLog = AuditLog.builder()
          .userId(userId)
          .action(action)
          .entityType(entityType)
          .entityId(entityId)
          .details(toJsonDetails(details))
          .build();

      // Veritabanına kaydet
      auditLogRepository.save(auditLog);

      log.debug("Audit log kaydedildi: userId={}, action={}, entityType={}, entityId={}",
          userId, action, entityType, entityId);

    } catch (Exception e) {
      // Audit log hatası ana işlemi etkilememeli
      log.error("Audit log kaydedilemedi: userId={}, action={}, error={}",
          userId, action, e.getMessage());
    }
  }

  private String toJsonDetails(String details) {
    if (details == null || details.isBlank()) {
      return null;
    }

    return "{\"message\":\"" + StringEscapeUtils.escapeJson(details) + "\"}";
  }

  @Override
  @Transactional
  public void log(Integer userId, String action, String entityType, Integer entityId) {
    log(userId, action, entityType, entityId, null);
  }

  @Override
  @Transactional
  public void log(Integer userId, String action) {
    log(userId, action, null, null, null);
  }
}

