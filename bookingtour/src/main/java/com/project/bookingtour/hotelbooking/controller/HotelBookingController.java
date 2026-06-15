package com.project.bookingtour.hotelbooking.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.HotelBookingCreateRequest;
import com.project.bookingtour.common.dto.response.HotelBookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.hotelbooking.service.HotelBookingService;
import com.project.bookingtour.security.AppUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hotel-bookings")
@RequiredArgsConstructor
public class HotelBookingController {

    private final HotelBookingService hotelBookingService;

    @GetMapping("/me")
    public ApiResponse<PageResponse<HotelBookingResponse>> myBookingHistory(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<PageResponse<HotelBookingResponse>> res = new ApiResponse<>();
        res.setData(hotelBookingService.listMyBookings(principal.getId(), page, size));
        return res;
    }

    @GetMapping("/me/{id}")
    public ApiResponse<HotelBookingResponse> myBookingDetail(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable Long id) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<HotelBookingResponse> res = new ApiResponse<>();
        res.setData(hotelBookingService.getMyBooking(principal.getId(), id));
        return res;
    }

    @PostMapping
    public ApiResponse<HotelBookingResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody HotelBookingCreateRequest request,
            HttpServletRequest httpRequest) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<HotelBookingResponse> res = new ApiResponse<>();
        res.setData(hotelBookingService.createBooking(principal.getId(), request, extractClientIp(httpRequest)));
        res.setMessage("Hotel booking created");
        return res;
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<HotelBookingResponse> cancel(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable Long id) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<HotelBookingResponse> res = new ApiResponse<>();
        res.setData(hotelBookingService.cancelMyBooking(principal.getId(), id));
        res.setMessage("Hotel booking cancelled");
        return res;
    }

    private static String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        return ip == null || ip.isBlank() ? "127.0.0.1" : ip;
    }
}
