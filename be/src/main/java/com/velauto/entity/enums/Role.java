package com.velauto.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Role {
  SUPER_ADMIN("Süper Yönetici"),
  ADMIN("Sistem Yöneticisi"),
  CUSTOMER("Müşteri"),
  STAFF("Çalışan");

  private final String description;

}