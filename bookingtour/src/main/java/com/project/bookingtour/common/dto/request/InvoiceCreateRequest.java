package com.project.bookingtour.common.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class InvoiceCreateRequest {

    private Long bookingId;
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
}
