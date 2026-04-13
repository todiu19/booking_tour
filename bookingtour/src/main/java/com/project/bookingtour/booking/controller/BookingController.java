package com.project.bookingtour.booking.controller;

import com.project.bookingtour.booking.service.BookingService;
import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.BookingCreateRequest;
import com.project.bookingtour.common.dto.response.BookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping("/me")
    public ApiResponse<PageResponse<BookingResponse>> myBookingHistory(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<PageResponse<BookingResponse>> res = new ApiResponse<>();
        res.setData(bookingService.listMyBookings(principal.getId(), page, size));
        return res;
    }

    @PostMapping
    public ApiResponse<BookingResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody BookingCreateRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<BookingResponse> res = new ApiResponse<>();
        res.setData(bookingService.createBooking(principal.getId(), request));
        res.setMessage("Booking created");
        return res;
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable Long id) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<BookingResponse> res = new ApiResponse<>();
        res.setData(bookingService.cancelMyBooking(principal.getId(), id));
        res.setMessage("Booking cancelled");
        return res;
    }
}
