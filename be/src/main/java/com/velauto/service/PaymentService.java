package com.velauto.service;

import com.velauto.dto.PaymentCreateDto;
import com.velauto.dto.PaymentResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

  PaymentResponseDto receivePayment(
      PaymentCreateDto request,
      Integer tenantId,
      Integer userId
  );

  PaymentResponseDto getPaymentById(
      Integer paymentId,
      Integer tenantId
  );

  Page<PaymentResponseDto> getPaymentsByServiceForm(
      Integer serviceFormId,
      Integer tenantId,
      Pageable pageable
  );

  void deletePayment(
      Integer paymentId,
      Integer tenantId,
      Integer userId
  );
}

