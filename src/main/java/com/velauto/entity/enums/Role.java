package com.velauto.entity.enums;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Role {
  super_admin("Süper Yönetici"),
  admin("Sistem Yöneticisi"),
  customer("Müşteri"),
  staff("Çalışan");

  @JsonValue
  private final String description;

}
