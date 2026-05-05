package com.velauto.entity.enums;

public enum PaymentStatus {
  PENDING("Bekleniyor"),
  PARTIAL("Kısmi Ödendi"),
  PAID("Ödendi");

  private final String description;

  PaymentStatus(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}