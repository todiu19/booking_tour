package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class TourItineraryHotelRequest {
    private Long hotelId;
    private Integer nightCount;
}
