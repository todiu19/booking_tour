package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class InvoiceUpdateRequest {

    private String billingName;
    private String billingPhone;
    private String billingEmail;
    private String billingAddress;
    private String note;
}
