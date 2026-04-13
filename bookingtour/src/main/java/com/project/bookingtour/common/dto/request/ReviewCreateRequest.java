package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class ReviewCreateRequest {
    private Long tourId;
    private Short rating;
    private String comment;
}
