package com.velauto.entity.enums;

public enum AppointmentStatus {
  PENDING("Beklemede"),
  APPROVED("Onaylandı"),
  COMPLETED("Tamamlandı"),
  CANCELLED("İptal Edildi");

  private final String displayName;

  AppointmentStatus(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }
}

