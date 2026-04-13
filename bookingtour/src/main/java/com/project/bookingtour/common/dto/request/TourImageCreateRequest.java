package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class TourImageCreateRequest {

    private String imageUrl;
    private Integer displayOrder;
}
