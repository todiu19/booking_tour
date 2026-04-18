package com.project.bookingtour.invoice.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.response.InvoiceResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.invoice.service.InvoiceService;
import com.project.bookingtour.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/me/{id}")
    public ApiResponse<InvoiceResponse> myInvoiceById(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable Long id) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<InvoiceResponse> res = new ApiResponse<>();
        res.setData(invoiceService.getMyInvoice(principal.getId(), id));
        return res;
    }
}
