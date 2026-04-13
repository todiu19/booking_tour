package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.domain.entity.Review;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ReviewResponse {

    private Long id;
    private Long tourId;
    private Long userId;
    private String reviewerName;
    private Short rating;
    private String comment;
    private ReviewStatus status;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review rev) {
        if (rev == null) {
            return null;
        }
        ReviewResponse r = new ReviewResponse();
        r.setId(rev.getId());
        r.setTourId(rev.getTour() != null ? rev.getTour().getId() : null);
        r.setUserId(rev.getUser() != null ? rev.getUser().getId() : null);
        r.setReviewerName(rev.getReviewerName());
        r.setRating(rev.getRating());
        r.setComment(rev.getComment());
        r.setStatus(rev.getStatus());
        r.setCreatedAt(rev.getCreatedAt());
        return r;
    }
}
