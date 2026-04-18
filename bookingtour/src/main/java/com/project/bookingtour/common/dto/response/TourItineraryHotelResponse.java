package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.TourItineraryHotel;
import lombok.Data;

@Data
public class TourItineraryHotelResponse {
    private HotelResponse hotel;
    private Integer nightCount;

    public static TourItineraryHotelResponse from(TourItineraryHotel item) {
        if (item == null) {
            return null;
        }
        TourItineraryHotelResponse r = new TourItineraryHotelResponse();
        r.setHotel(HotelResponse.from(item.getHotel()));
        r.setNightCount(item.getNightCount());
        return r;
    }
}
