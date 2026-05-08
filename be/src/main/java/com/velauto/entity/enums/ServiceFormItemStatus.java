package com.velauto.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ServiceFormItemStatus {
  BEKLIYOR,
  ISLEMDE,
  TAMAMLANDI;

  @JsonCreator
  public static ServiceFormItemStatus fromValue(String value) {
    if (value == null || value.isBlank()) {
      return BEKLIYOR;
    }

    String normalized = value.trim()
        .replace('İ', 'I')
        .replace('ı', 'i')
        .replace('Ş', 'S')
        .replace('ş', 's')
        .toUpperCase()
        .replace(" ", "")
        .replace("_", "");

    return switch (normalized) {
      case "ISLEMDE" -> ISLEMDE;
      case "TAMAMLANDI", "COMPLETED" -> TAMAMLANDI;
      case "BEKLIYOR", "PENDING" -> BEKLIYOR;
      default -> ServiceFormItemStatus.valueOf(value.trim().toUpperCase());
    };
  }

  @JsonValue
  public String toJson() {
    return name();
  }
}
