package com.velauto.entity.enums;

public enum ExpenseCategory {
  OUTSOURCE_LABOR("Dış İşçilik/Tornacı"),
  SPARE_PARTS("Parça Alımı"),
  RENT("Kira"),
  UTILITIES("Faturalar"),
  OTHER("Diğer");

  private final String displayName;

  ExpenseCategory(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }
}

