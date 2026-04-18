package com.project.bookingtour.review.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.ReviewCreateRequest;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.ReviewResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.review.service.ReviewService;
import com.project.bookingtour.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/tour/{tourId}")
    public ApiResponse<PageResponse<ReviewResponse>> getByTour(
            @PathVariable Long tourId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ApiResponse<PageResponse<ReviewResponse>> res = new ApiResponse<>();
        res.setData(reviewService.getVisibleReviewsByTour(tourId, page, size));
        return res;
    }

    @PostMapping
    public ApiResponse<ReviewResponse> create(
            @AuthenticationPrincipal AppUserDetails principal, @RequestBody ReviewCreateRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<ReviewResponse> res = new ApiResponse<>();
        res.setData(reviewService.createMyReview(principal.getId(), request));
        res.setMessage("Review created");
        return res;
    }
}
