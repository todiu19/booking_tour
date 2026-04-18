package com.project.bookingtour.destination.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.destination.service.DestinationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    /**
     * Tìm kiếm / lọc điểm đến (phân trang). Không query → toàn bộ. Tham số tùy chọn: {@code
     * keyword} (tên hoặc tỉnh hoặc quốc gia), {@code province}, {@code country} (chuỗi con).
     */
    @GetMapping
    public ApiResponse<PageResponse<DestinationResponse>> search(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String country) {
        ApiResponse<PageResponse<DestinationResponse>> res = new ApiResponse<>();
        res.setData(destinationService.searchDestinations(page, size, keyword, province, country));
        return res;
    }

    /**
     * Điểm đến nổi bật (theo số booking), dùng {@link DestinationService#getTopDestinations(int)} —
     * cùng dữ liệu với trường {@code topDestinations} trong {@code GET /home}. {@code size} clamp
     * 6–20.
     */
    @GetMapping("/top")
    public ApiResponse<List<DestinationResponse>> getTopDestinations(
            @RequestParam(defaultValue = "10") int size) {
        int limit = Math.min(Math.max(size, 10), 20);
        ApiResponse<List<DestinationResponse>> res = new ApiResponse<>();
        res.setData(destinationService.getTopDestinations(limit));
        return res;
    }

    @GetMapping("/{id}")
    public ApiResponse<DestinationResponse> getDestination(@PathVariable Long id) {
        ApiResponse<DestinationResponse> res = new ApiResponse<>();
        res.setData(destinationService.getDestination(id));
        return res;
    }

    @GetMapping("/{id}/tours")
    public ApiResponse<PageResponse<TourResponse>> getPublishedToursByDestination(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ApiResponse<PageResponse<TourResponse>> res = new ApiResponse<>();
        res.setData(destinationService.getPublishedToursByDestination(id, page, size));
        return res;
    }
}
