package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.PaymentProvider;
import lombok.Data;

@Data
public class PaymentCreateRequest {

    private Long bookingId;
    private PaymentProvider provider;
}
