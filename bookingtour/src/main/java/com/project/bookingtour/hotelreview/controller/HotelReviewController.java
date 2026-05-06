package com.project.bookingtour.hotelreview.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.HotelReviewCreateRequest;
import com.project.bookingtour.common.dto.response.HotelReviewResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.hotelreview.service.HotelReviewService;
import com.project.bookingtour.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hotel-reviews")
@RequiredArgsConstructor
public class HotelReviewController {

    private final HotelReviewService hotelReviewService;

    @PostMapping
    public ApiResponse<HotelReviewResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody HotelReviewCreateRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<HotelReviewResponse> res = new ApiResponse<>();
        res.setData(hotelReviewService.createFromHotelBooking(principal.getId(), request));
        res.setMessage("Hotel review created");
        return res;
    }
}
