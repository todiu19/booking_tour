package com.project.bookingtour.home.service;

import com.project.bookingtour.common.dto.response.HomeResponse;
import com.project.bookingtour.destination.service.DestinationService;
import com.project.bookingtour.tour.service.TourService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class HomeService {

    private final TourService tourService;
    private final DestinationService destinationService;

    /**
     * Gom dữ liệu trang chủ từ các service module tour / destination.
     * {@code size} clamp 6–20; tìm kiếm / lọc theo tiêu chí dùng {@code GET /tours} (query params).
     */
    public HomeResponse getHomeData(int size) {
        int limit = Math.min(Math.max(size, 10), 20);

        HomeResponse h = new HomeResponse();
        h.setFeaturedTours(tourService.getPublishedFeatured(limit));
        h.setLatestTours(tourService.getPublishedLatest(limit));
        h.setTopDestinations(destinationService.getTopDestinations(limit));
        return h;
    }
}
