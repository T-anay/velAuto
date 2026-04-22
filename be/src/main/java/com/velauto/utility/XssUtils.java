package com.velauto.utility;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.web.util.HtmlUtils;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class XssUtils {

  public static String sanitize(String input) {
    if (input == null || input.isBlank()) {
      return input;
    }
    return HtmlUtils.htmlEscape(input);
  }

  public static String unescape(String escaped) {
    if (escaped == null || escaped.isBlank()) {
      return escaped;
    }
    return HtmlUtils.htmlUnescape(escaped);
  }
}

