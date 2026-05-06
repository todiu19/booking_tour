package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class HotelReviewCreateRequest {

    private Long hotelBookingId;
    private Integer rating;
    private String comment;
}
