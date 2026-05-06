package com.project.bookingtour.hotel.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.response.HotelResponse;
import com.project.bookingtour.hotel.service.HotelService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;

    @GetMapping
    public ApiResponse<List<HotelResponse>> listHotels(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String hotelType,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double minStars,
            @RequestParam(required = false) Double maxStars,
            @RequestParam(required = false) Integer roomCapacity,
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String sortBy) {
        ApiResponse<List<HotelResponse>> res = new ApiResponse<>();
        res.setData(
                hotelService.listHotels(
                        keyword,
                        name,
                        location,
                        destination,
                        hotelType,
                        minRating,
                        minStars,
                        maxStars,
                        roomCapacity,
                        destinationId,
                        sortBy));
        return res;
    }

    @GetMapping("/{id}")
    public ApiResponse<HotelResponse> getHotel(@PathVariable Long id) {
        ApiResponse<HotelResponse> res = new ApiResponse<>();
        res.setData(hotelService.getHotel(id));
        return res;
    }

    @GetMapping("/types")
    public ApiResponse<List<String>> listHotelTypes() {
        ApiResponse<List<String>> res = new ApiResponse<>();
        res.setData(hotelService.listHotelTypes());
        return res;
    }
}
