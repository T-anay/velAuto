package com.velauto.service;

public interface AuditLogService {

  void log(Integer userId, String action, String entityType, Integer entityId, String details);

  void log(Integer userId, String action, String entityType, Integer entityId);

  void log(Integer userId, String action);
}

