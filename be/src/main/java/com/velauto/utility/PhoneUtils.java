package com.velauto.utility;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PhoneUtils {

  private static final String DEFAULT_COUNTRY_CODE = "+90";

  public static String normalize(String phone) {
    if (phone == null || phone.isBlank()) {
      throw new IllegalArgumentException("Telefon numarasi bos birakilamaz");
    }

    String cleaned = phone.replaceAll("[^0-9+]", "").trim();

    if (cleaned.isEmpty()) {
      throw new IllegalArgumentException("Telefon numarasi geçersiz: sayi icermiyor");
    }

    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("0")) {
        cleaned = DEFAULT_COUNTRY_CODE + cleaned.substring(1);
      } else {
        cleaned = DEFAULT_COUNTRY_CODE + cleaned;
      }
    }

    return cleaned;
  }

  public static boolean areSameCanonical(String phone1, String phone2) {
    try {
      return normalize(phone1).equals(normalize(phone2));
    } catch (IllegalArgumentException e) {
      return false;
    }
  }
}

