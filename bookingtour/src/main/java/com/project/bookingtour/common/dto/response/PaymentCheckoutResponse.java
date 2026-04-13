package com.project.bookingtour.common.dto.response;

import lombok.Data;

@Data
public class PaymentCheckoutResponse {

    private PaymentResponse payment;
    private InvoiceResponse invoice;
    /** Chỉ có với provider = vnpay: frontend redirect URL. */
    private String paymentUrl;
}
