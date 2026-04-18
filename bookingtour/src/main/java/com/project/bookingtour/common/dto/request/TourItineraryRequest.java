package com.project.bookingtour.common.dto.request;

import java.util.List;
import lombok.Data;

@Data
public class TourItineraryRequest {
    private Integer dayNumber;
    private String title;
    private String description;
    private List<TourItineraryHotelRequest> hotels;
}
