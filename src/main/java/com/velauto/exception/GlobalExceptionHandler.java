package com.velauto.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
    HttpStatus status = ex.getStatus();
    ErrorResponse error = new ErrorResponse(
        LocalDateTime.now(),
        status.value(),
        "İş Mantığı Hatası",
        ex.getMessage(),
        request.getRequestURI()
    );
    return new ResponseEntity<>(error, status);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
    ErrorResponse error = new ErrorResponse(
        LocalDateTime.now(),
        HttpStatus.INTERNAL_SERVER_ERROR.value(),
        "Sistem Hatası",
        "Beklenmedik bir hata oluştu: " + ex.getMessage(),
        request.getRequestURI()
    );
    return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}