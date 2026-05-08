package com.velauto.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
    HttpStatus status = ex.getStatus() != null ? ex.getStatus() : HttpStatus.BAD_REQUEST;

    // Beklenen iş kuralı hatalarında (özellikle 4xx) stack trace basmayalım.
    if (status.is5xxServerError()) {
      System.err.println("--- BUSINESS EXCEPTION YAKALANDI ---");
      ex.printStackTrace();
    } else {
      System.err.printf("--- BUSINESS EXCEPTION (%d) --- %s [%s]%n", status.value(), ex.getMessage(), request.getRequestURI());
    }

    ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            status.value(),
            "İş Mantığı Hatası",
            ex.getMessage(),
            request.getRequestURI()
    );
    return new ResponseEntity<>(error, status);
  }

  // 2. DTO VALIDASYON HATALARINI NOKTA ATIŞI YAKALAMAK İÇİN YENİ EKLENDİ
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatchException(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
    System.err.println("--- TYPE MISMATCH HATASI YAKALANDI ---");
    ex.printStackTrace();

    String errorMessage;
    if ("undefined".equals(ex.getValue())) {
      errorMessage = "Personel ID'si boş veya tanımsız. Lütfen geçerli bir personel seçin.";
    } else {
      errorMessage = String.format("'%s' değeri '%s' tipine dönüştürülemedi. Beklenen tip: %s", 
          ex.getName(), ex.getValue(), ex.getRequiredType().getSimpleName());
    }

    ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Parametre Tip Hatası",
            errorMessage,
            request.getRequestURI()
    );
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
    System.err.println("--- VALIDASYON HATASI YAKALANDI ---");
    ex.printStackTrace();

    // Hangi alanın hatalı olduğunu (örn: appointmentDate: Geçmiş tarih olamaz) mesaj olarak birleştirir
    String errorMessage = ex.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .collect(Collectors.joining(", "));

    ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Validasyon Hatası",
            errorMessage, // Artık Network sekmesinde "İstek parametreleri geçersiz" yerine "appointmentDate: boş olamaz" gibi net bir mesaj göreceğiz.
            request.getRequestURI()
    );
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
    // 3. GİZLİ HATALARI KONSOLDA GÖRMEK İÇİN EKLENDİ
    System.err.println("--- GLOBAL EXCEPTION YAKALANDI ---");
    ex.printStackTrace();

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