package com.velauto.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ExpenseCategory {
  OUTSOURCE_LABOR("Dis Iscilik/Tornaci"),
  SPARE_PARTS("Parca Alimi"),
  RENT("Kira"),
  UTILITIES("Faturalar"),
  OTHER("Diger");

  private final String displayName;

  ExpenseCategory(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }

  @JsonCreator
  public static ExpenseCategory fromValue(String value) {
    if (value == null || value.isBlank()) {
      return OTHER;
    }

    String normalized = value.trim()
        .replace('İ', 'I')
        .replace('ı', 'i')
        .toUpperCase()
        .replace(" ", "_");

    return switch (normalized) {
      case "KIRA", "RENT" -> RENT;
      case "DIS_ISCILIK", "DIS_ISCILIK_TORNACI", "OUTSOURCE_LABOR" -> OUTSOURCE_LABOR;
      case "PARCA", "PARCA_ALIMI", "SPARE_PARTS" -> SPARE_PARTS;
      case "FATURA", "FATURALAR", "UTILITIES" -> UTILITIES;
      case "DIGER", "OTHER" -> OTHER;
      default -> ExpenseCategory.valueOf(normalized);
    };
  }

  @JsonValue
  public String toJson() {
    return name();
  }
}
