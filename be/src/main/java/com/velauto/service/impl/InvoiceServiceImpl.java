package com.velauto.service.impl;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.velauto.dto.InvoiceResponseDto;
import com.velauto.entity.Invoice;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.ServiceFormItem;
import com.velauto.exception.BusinessException;
import com.velauto.repository.InvoiceRepository;
import com.velauto.repository.ServiceFormRepository;
import com.velauto.repository.ServiceFormItemRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceServiceImpl implements InvoiceService {

  private final InvoiceRepository invoiceRepository;
  private final ServiceFormRepository serviceFormRepository;
  private final ServiceFormItemRepository serviceFormItemRepository;
  private final AuditLogService auditLogService;

  @Override
  public InvoiceResponseDto generateInvoice(Integer serviceFormId, Integer tenantId, Integer userId) {
    if (serviceFormId == null || tenantId == null) {
      throw new BusinessException("Invalid request", HttpStatus.BAD_REQUEST);
    }

    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(serviceFormId, tenantId);
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException("Service form not found", HttpStatus.NOT_FOUND);
    }

    ServiceForm serviceForm = serviceFormOptional.get();
    List<ServiceFormItem> items = serviceFormItemRepository.findByServiceFormIdAndTenantId(serviceFormId, tenantId);

    String invoiceNumber = generateInvoiceNumber(tenantId);
    byte[] pdfBytes = generatePdfBytes(serviceForm, items, invoiceNumber);
    String pdfUrl = "data:application/pdf;base64," + java.util.Base64.getEncoder().encodeToString(pdfBytes);

    Invoice invoice = Invoice.builder()
        .tenantId(tenantId)
        .serviceFormId(serviceFormId)
        .invoiceNumber(invoiceNumber)
        .issueDate(LocalDateTime.now())
        .totalAmount(serviceForm.getTotalAmount())
        .totalTax(serviceForm.getTotalTax())
        .pdfUrl(pdfUrl)
        .createdBy(userId)
        .createdAt(LocalDateTime.now())
        .build();

    Invoice savedInvoice = invoiceRepository.save(invoice);

    serviceForm.setIsLocked(true);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());
    serviceFormRepository.save(serviceForm);

    // Audit log for locking
    auditLogService.log(userId, "SERVICE_FORM_LOCKED_AFTER_INVOICE", "SERVICE_FORM", serviceFormId, "İş emri faturalandırıldı ve kilitlendi");

    return InvoiceResponseDto.builder()
        .id(savedInvoice.getId())
        .invoiceNumber(savedInvoice.getInvoiceNumber())
        .issueDate(savedInvoice.getIssueDate())
        .totalAmount(savedInvoice.getTotalAmount())
        .totalTax(savedInvoice.getTotalTax())
        .pdfUrl(savedInvoice.getPdfUrl())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public byte[] downloadInvoicePdf(Integer invoiceId, Integer tenantId) {
    if (invoiceId == null || tenantId == null) {
      throw new BusinessException("Invalid request", HttpStatus.BAD_REQUEST);
    }

    Optional<Invoice> invoiceOptional = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId);
    if (invoiceOptional.isEmpty()) {
      throw new BusinessException("Invoice not found", HttpStatus.NOT_FOUND);
    }

    Invoice invoice = invoiceOptional.get();
    if (invoice.getPdfUrl().startsWith("data:application/pdf;base64,")) {
      String base64Data = invoice.getPdfUrl().substring(28);
      return java.util.Base64.getDecoder().decode(base64Data);
    }

    return new byte[0];
  }

  private String generateInvoiceNumber(Integer tenantId) {
    String prefix = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
    Integer maxSeq = invoiceRepository.getMaxInvoiceSequence(tenantId, prefix + "%");
    int nextSeq = (maxSeq != null ? maxSeq : 0) + 1;
    return prefix + String.format("%03d", nextSeq);
  }

  private byte[] generatePdfBytes(ServiceForm serviceForm, List<ServiceFormItem> items, String invoiceNumber) {
    try {
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      Document document = new Document();
      PdfWriter.getInstance(document, outputStream);
      document.open();

      // Title
      Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
      document.add(new Paragraph("FATURA", titleFont));
      document.add(new Paragraph("Invoice Number: " + invoiceNumber));
      document.add(new Paragraph(" "));

      // Table
      PdfPTable table = new PdfPTable(4);
      table.setWidthPercentage(100);

      // Headers
      String[] headers = {"Item Name", "Quantity", "Unit Price", "Line Total"};
      for (String header : headers) {
        PdfPCell cell = new PdfPCell(new Phrase(header));
        cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        table.addCell(cell);
      }

      // Items
      for (ServiceFormItem item : items) {
        table.addCell(item.getItemName() != null ? item.getItemName() : "N/A");
        table.addCell(item.getQuantity().toString());
        table.addCell(item.getUnitPrice().toString());
        table.addCell(item.getLineTotal().toString());
      }

      document.add(table);
      document.add(new Paragraph(" "));

      // Totals
      document.add(new Paragraph("Total Amount: " + serviceForm.getTotalAmount()));
      document.add(new Paragraph("Total Tax: " + serviceForm.getTotalTax()));

      document.close();
      return outputStream.toByteArray();
    } catch (Exception e) {
      log.error("PDF generation failed: {}", e.getMessage());
      throw new BusinessException("Failed to generate PDF", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

