package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import lombok.Data;

@Data
public class BookingUpdateRequest {

    private BookingStatus bookingStatus;
    private BookingPaymentStatus paymentStatus;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String note;
}
