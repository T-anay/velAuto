package com.velauto.service;

import com.velauto.dto.InvoiceResponseDto;

public interface InvoiceService {

  InvoiceResponseDto generateInvoice(Integer serviceFormId, Integer userId);

  byte[] downloadInvoicePdf(Integer invoiceId);
}

