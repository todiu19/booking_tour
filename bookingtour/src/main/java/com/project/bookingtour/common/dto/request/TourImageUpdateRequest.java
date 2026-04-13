package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class TourImageUpdateRequest {

    private String imageUrl;
    private Integer displayOrder;
}
