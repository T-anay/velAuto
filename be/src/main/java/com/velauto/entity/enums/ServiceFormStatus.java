package com.velauto.entity.enums;

public enum ServiceFormStatus {
  OPEN("Açık"),
  IN_PROGRESS("Devam Ediyor"),
  COMPLETED("Tamamlandı"),
  CANCELLED("İptal Edildi");

  private final String displayName;

  ServiceFormStatus(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }
}

