package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.PaymentStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class PaymentUpdateRequest {

    private PaymentStatus paymentStatus;
    private LocalDateTime paidAt;
}
