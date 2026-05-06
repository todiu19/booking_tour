package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.HotelReview;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HotelReviewResponse {

    private Long id;
    private Long hotelId;
    private Long hotelBookingId;
    private Short rating;
    private String comment;
    private LocalDateTime createdAt;

    public static HotelReviewResponse from(HotelReview entity) {
        if (entity == null) return null;
        HotelReviewResponse r = new HotelReviewResponse();
        r.setId(entity.getId());
        r.setHotelId(entity.getHotel() != null ? entity.getHotel().getId() : null);
        r.setHotelBookingId(entity.getHotelBooking() != null ? entity.getHotelBooking().getId() : null);
        r.setRating(entity.getRating());
        r.setComment(entity.getComment());
        r.setCreatedAt(entity.getCreatedAt());
        return r;
    }
}
