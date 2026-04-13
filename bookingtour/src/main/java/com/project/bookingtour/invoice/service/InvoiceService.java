package com.project.bookingtour.invoice.service;

import com.project.bookingtour.common.dto.response.InvoiceResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> listMyInvoices(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<Invoice> result = invoiceRepository.findByUser_Id(userId, pageable);
        return PageResponse.fromPage(result.map(InvoiceResponse::from));
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getMyInvoice(Long userId, Long invoiceId) {
        Invoice invoice =
                invoiceRepository
                        .findByIdAndUser_Id(invoiceId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
        return InvoiceResponse.from(invoice);
    }
}
