package com.velauto.controller;

import com.velauto.dto.InvoiceResponseDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

  private final InvoiceService invoiceService;

  @PostMapping("/generate/{serviceFormId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<InvoiceResponseDto> generateInvoice(
      @PathVariable Integer serviceFormId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    InvoiceResponseDto invoice = invoiceService.generateInvoice(serviceFormId, userDetails.getUserId());
    return ResponseEntity.ok(invoice);
  }

  @GetMapping("/{invoiceId}/download")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<byte[]> downloadInvoicePdf(
      @PathVariable Integer invoiceId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {

    byte[] pdfBytes = invoiceService.downloadInvoicePdf(invoiceId);

    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + invoiceId + ".pdf\"")
        .body(pdfBytes);
  }
}

