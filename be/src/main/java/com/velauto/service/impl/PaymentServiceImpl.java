package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.PaymentCreateDto;
import com.velauto.dto.PaymentResponseDto;
import com.velauto.entity.Payment;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.enums.ServiceFormStatus;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.PaymentMapper;
import com.velauto.repository.PaymentRepository;
import com.velauto.repository.ServiceFormRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

  private final PaymentRepository paymentRepository;
  private final ServiceFormRepository serviceFormRepository;
  private final PaymentMapper paymentMapper;
  private final AuditLogService auditLogService;

  @Override
  public PaymentResponseDto receivePayment(
      PaymentCreateDto request,
      Integer userId
  ) {
    // Guard Clause 1: Input validation
    if (request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Guard Clause 2: Fetch ServiceForm - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(
        request.getServiceFormId()
    );
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }
    ServiceForm serviceForm = serviceFormOptional.get();

    // Guard Clause 3: Check ServiceForm status
    if (serviceForm.getStatus() != ServiceFormStatus.COMPLETED &&
        serviceForm.getStatus() != ServiceFormStatus.IN_PROGRESS) {
      throw new BusinessException(Messages.PAYMENT_FORM_STATUS_INVALID);
    }

    // Guard Clause 4: Check if ServiceForm is deleted
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    // Finansal Kontrol: Calculate total payments for this ServiceForm
    BigDecimal totalPaidAmount = paymentRepository.sumPaymentsByServiceForm(
        request.getServiceFormId()
    );

    // New payment total
    BigDecimal newTotalAmount = totalPaidAmount.add(request.getAmount());

    // Guard Clause 5: Check if new payment exceeds ServiceForm totalAmount
    if (newTotalAmount.compareTo(serviceForm.getTotalAmount()) > 0) {
      throw new BusinessException(Messages.PAYMENT_AMOUNT_EXCEEDED);
    }

    // Map DTO to Entity
    Payment payment = paymentMapper.toPayment(request);
    payment.setServiceFormId(request.getServiceFormId());
    payment.setAmount(request.getAmount());
    payment.setPaymentDate(LocalDateTime.now());
    payment.setCreatedBy(userId);
    payment.setCreatedAt(LocalDateTime.now());

    // Save payment
    Payment savedPayment = paymentRepository.save(payment);

    // Otomatik Güncelleme: Update ServiceForm status if fully paid - Yorum: Status zaten IN_PROGRESS/COMPLETED
    // Tam ödendiğinde loglama yap
    if (newTotalAmount.compareTo(serviceForm.getTotalAmount()) == 0) {
      String auditLogMessage = String.format(
          "Servis formu tam ödendi: serviceFormID=%d, totalAmount=%s",
          request.getServiceFormId(),
          serviceForm.getTotalAmount()
      );
      auditLogService.log(userId, "SERVICE_FORM_FULLY_PAID", "SERVICE_FORM", serviceForm.getId(), auditLogMessage);
    }

    // Audit Log
    String auditDetails = String.format(
        "Ödeme alındı: serviceFormID=%d, amount=%s, method=%s, totalPaid=%s",
        request.getServiceFormId(),
        request.getAmount(),
        request.getPaymentMethod(),
        newTotalAmount
    );
    auditLogService.log(userId, "PAYMENT_RECEIVED", "PAYMENT", savedPayment.getId(), auditDetails);

    return paymentMapper.toResponseDto(savedPayment);
  }

  @Override
  @Transactional(readOnly = true)
  public PaymentResponseDto getPaymentById(Integer paymentId, Integer userId) {
    // Guard Clause: Input validation
    if (paymentId == null) {
      throw new BusinessException(Messages.PAYMENT_NOT_FOUND);
    }

    // Fetch payment - No Optional chaining
    Optional<Payment> paymentOptional = paymentRepository.findByIdAndDeletedAtIsNull(paymentId);
    if (paymentOptional.isEmpty()) {
      throw new BusinessException(Messages.PAYMENT_NOT_FOUND);
    }

    Payment payment = paymentOptional.get();
    return paymentMapper.toResponseDto(payment);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<PaymentResponseDto> getPaymentsByServiceForm(
      Integer serviceFormId,
      Pageable pageable
  ) {
    // Guard Clause: Input validation
    if (serviceFormId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<Payment> payments = paymentRepository.findByServiceFormIdAndDeletedAtIsNullPaged(
        serviceFormId,
        pageable
    );
    return payments.map(paymentMapper::toResponseDto);
  }

  @Override
  public void deletePayment(Integer paymentId, Integer userId) {
    if (paymentId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }
    // Fetch payment - No Optional chaining
    Optional<Payment> paymentOptional = paymentRepository.findByIdAndDeletedAtIsNull(paymentId);
    if (paymentOptional.isEmpty()) {
      throw new BusinessException(Messages.PAYMENT_NOT_FOUND);
    }

    Payment payment = paymentOptional.get();

    // Guard Clause: Already deleted?
    if (payment.getDeletedAt() != null) {
      throw new BusinessException(Messages.PAYMENT_ALREADY_DELETED);
    }

    // Soft delete
    LocalDateTime now = LocalDateTime.now();
    payment.setDeletedAt(now);
    payment.setDeletedBy(userId);
    paymentRepository.save(payment);

    // Audit log
    String auditDetails = String.format(
        "Ödeme silindi: serviceFormID=%d, amount=%s",
        payment.getServiceFormId(),
        payment.getAmount()
    );
    auditLogService.log(userId, "PAYMENT_DELETED", "PAYMENT", paymentId, auditDetails);
  }
}

