package com.velauto.entity.enums;

public enum PaymentMethod {
  CASH("Nakit"),
  CREDIT_CARD("Kredi Kartı"),
  BANK_TRANSFER("Banka Havalesi/EFT"),
  DEBIT_CARD("Banka Kartı");

  private final String description;

  PaymentMethod(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}