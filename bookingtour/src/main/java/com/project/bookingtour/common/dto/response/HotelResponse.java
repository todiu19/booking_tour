package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.Hotel;
import lombok.Data;

@Data
public class HotelResponse {
    private Long id;
    private String name;
    private String address;
    private Integer stars;

    public static HotelResponse from(Hotel hotel) {
        if (hotel == null) {
            return null;
        }
        HotelResponse r = new HotelResponse();
        r.setId(hotel.getId());
        r.setName(hotel.getName());
        r.setAddress(hotel.getAddress());
        r.setStars(hotel.getStars());
        return r;
    }
}
