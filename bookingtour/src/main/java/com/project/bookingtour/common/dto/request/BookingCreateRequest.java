package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.PaymentProvider;
import lombok.Data;

@Data
public class BookingCreateRequest {

    private Long tourId;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private Integer adultCount;
    private Integer childCount;
    private String note;
    private PaymentProvider paymentMethod;
}
