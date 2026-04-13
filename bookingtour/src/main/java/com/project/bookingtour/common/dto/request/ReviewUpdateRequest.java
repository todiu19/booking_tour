package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.ReviewStatus;
import lombok.Data;

@Data
public class ReviewUpdateRequest {

    private String reviewerName;
    private Short rating;
    private String comment;
    private ReviewStatus status;
}
