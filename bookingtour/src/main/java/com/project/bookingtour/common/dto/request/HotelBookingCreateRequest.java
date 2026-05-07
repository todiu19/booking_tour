package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.PaymentProvider;
import java.time.LocalDate;
import lombok.Data;

@Data
public class HotelBookingCreateRequest {

    private Long hotelId;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer roomCount;
    private Integer guestCount;
    private PaymentProvider paymentMethod;
    private String note;
}
