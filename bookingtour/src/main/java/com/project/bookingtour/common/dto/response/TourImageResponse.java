package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.TourImage;
import lombok.Data;

@Data
public class TourImageResponse {

    private Long id;
    private Long tourId;
    private String imageUrl;
    private Integer displayOrder;

    public static TourImageResponse from(TourImage img) {
        if (img == null) {
            return null;
        }
        TourImageResponse r = new TourImageResponse();
        r.setId(img.getId());
        r.setTourId(img.getTour() != null ? img.getTour().getId() : null);
        r.setImageUrl(img.getImageUrl());
        r.setDisplayOrder(img.getDisplayOrder());
        return r;
    }
}
