package com.velauto.validation;

import com.velauto.constant.Messages;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

  // En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam
  private static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";

  private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

  @Override
  public void initialize(ValidPassword constraintAnnotation) {
    ConstraintValidator.super.initialize(constraintAnnotation);
  }

  @Override
  public boolean isValid(String password, ConstraintValidatorContext context) {
    if (password == null || password.trim().isEmpty()) {
      return false;
    }

    boolean isValid = pattern.matcher(password).matches();

    if (!isValid) {
      context.disableDefaultConstraintViolation();
      context.buildConstraintViolationWithTemplate(Messages.PASSWORD_POLICY_VIOLATION)
          .addConstraintViolation();
    }

    return isValid;
  }
}

