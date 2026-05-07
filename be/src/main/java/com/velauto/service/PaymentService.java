package com.velauto.service;

import com.velauto.dto.PaymentCreateDto;
import com.velauto.dto.PaymentResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

  PaymentResponseDto receivePayment(
      PaymentCreateDto request,
      Integer userId
  );

  PaymentResponseDto getPaymentById(
      Integer paymentId,
      Integer userId
  );

  Page<PaymentResponseDto> getPaymentsByServiceForm(
      Integer serviceFormId,
      Pageable pageable
  );

  void deletePayment(
      Integer paymentId,
      Integer userId
  );
}

