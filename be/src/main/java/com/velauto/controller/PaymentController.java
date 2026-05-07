package com.velauto.controller;

import com.velauto.dto.PaymentCreateDto;
import com.velauto.dto.PaymentResponseDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentService paymentService;

  @PostMapping
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<PaymentResponseDto> receivePayment(
      @Valid @RequestBody PaymentCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    PaymentResponseDto response = paymentService.receivePayment(
        request,
        userDetails.getUserId()
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<PaymentResponseDto> getPaymentById(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    PaymentResponseDto response = paymentService.getPaymentById(
        id,
        null
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/by-form/{serviceFormId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<PaymentResponseDto>> getPaymentsByServiceForm(
      @PathVariable Integer serviceFormId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<PaymentResponseDto> response = paymentService.getPaymentsByServiceForm(
        serviceFormId,
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager')")
  public ResponseEntity<Void> deletePayment(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    paymentService.deletePayment(
        id,
        userDetails.getUserId()
    );
    return ResponseEntity.noContent().build();
  }
}

