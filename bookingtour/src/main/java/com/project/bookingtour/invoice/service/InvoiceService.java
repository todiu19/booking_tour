package com.project.bookingtour.invoice.service;

import com.project.bookingtour.common.dto.response.InvoiceResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public InvoiceResponse getMyInvoice(Long userId, Long invoiceId) {
        Invoice invoice =
                invoiceRepository
                        .findByIdAndUser_Id(invoiceId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
        return InvoiceResponse.from(invoice);
    }
}
