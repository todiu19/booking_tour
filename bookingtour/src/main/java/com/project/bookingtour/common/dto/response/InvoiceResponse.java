package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.Invoice;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class InvoiceResponse {

    private Long id;
    private String invoiceNo;
    private Long bookingId;
    private Long userId;
    private Long paymentId;
    private LocalDateTime issuedAt;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String billingName;
    private String billingPhone;
    private String billingEmail;
    private String billingAddress;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InvoiceResponse from(Invoice inv) {
        if (inv == null) {
            return null;
        }
        InvoiceResponse r = new InvoiceResponse();
        r.setId(inv.getId());
        r.setInvoiceNo(inv.getInvoiceNo());
        r.setBookingId(inv.getBooking() != null ? inv.getBooking().getId() : null);
        r.setUserId(inv.getUser() != null ? inv.getUser().getId() : null);
        r.setPaymentId(inv.getPayment() != null ? inv.getPayment().getId() : null);
        r.setIssuedAt(inv.getIssuedAt());
        r.setSubtotalAmount(inv.getSubtotalAmount());
        r.setTaxAmount(inv.getTaxAmount());
        r.setTotalAmount(inv.getTotalAmount());
        r.setBillingName(inv.getBillingName());
        r.setBillingPhone(inv.getBillingPhone());
        r.setBillingEmail(inv.getBillingEmail());
        r.setBillingAddress(inv.getBillingAddress());
        r.setNote(inv.getNote());
        r.setCreatedAt(inv.getCreatedAt());
        r.setUpdatedAt(inv.getUpdatedAt());
        return r;
    }
}
