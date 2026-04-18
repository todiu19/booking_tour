package com.project.bookingtour.common.dto.response;

import lombok.Data;

@Data
public class BookingCheckoutResponse {

    private BookingResponse booking;
    private PaymentResponse payment;
    private InvoiceResponse invoice;
    private String paymentUrl;
}
