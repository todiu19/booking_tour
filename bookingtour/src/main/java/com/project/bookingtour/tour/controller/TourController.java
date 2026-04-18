package com.project.bookingtour.tour.controller;


import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.tour.service.TourService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    /**
     * Danh sách / tìm kiếm tour công khai (published). Không gửi tham số lọc → trả về toàn bộ
     * tour đã xuất bản (phân trang). Có tham số → lọc theo tiêu chí tương ứng.
     */
    @GetMapping
    public ApiResponse<PageResponse<TourResponse>> listPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minDurationDays,
            @RequestParam(required = false) Integer maxDurationDays,
            @RequestParam(required = false) Long destinationId) {
        ApiResponse<PageResponse<TourResponse>> res = new ApiResponse<>();
        res.setData(
                tourService.listPublishedTours(
                        page,
                        size,
                        keyword,
                        minPrice,
                        maxPrice,
                        minDurationDays,
                        maxDurationDays,
                        destinationId));
        return res;
    }

    @GetMapping("/{id}")
    public ApiResponse<TourResponse> getTour(@PathVariable Long id) {
        ApiResponse<TourResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(tourService.getTour(id));
        return apiResponse;
    }

}
