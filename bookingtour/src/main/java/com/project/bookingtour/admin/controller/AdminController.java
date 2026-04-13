package com.project.bookingtour.admin.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.DestinationCreateRequest;
import com.project.bookingtour.common.dto.request.DestinationUpdateRequest;
import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.request.UserUpdateRequest;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ApiResponse<PageResponse<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        ApiResponse<PageResponse<UserResponse>> res = new ApiResponse<>();
        res.setData(adminService.listUsers(page, size));
        return res;
    }

    @GetMapping("/users/{id}")
    public ApiResponse<UserResponse> getUser(@PathVariable Long id) {
        ApiResponse<UserResponse> res = new ApiResponse<>();
        res.setData(adminService.getUser(id));
        return res;
    }

    @PostMapping("/users")
    public ApiResponse<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        ApiResponse<UserResponse> res = new ApiResponse<>();
        res.setData(adminService.createUser(request));
        return res;
    }

    // @PutMapping("/users/{id}")
    // public ApiResponse<UserResponse> updateUser(
    //         @PathVariable Long id, @RequestBody UserUpdateRequest request) {
    //     ApiResponse<UserResponse> res = new ApiResponse<>();
    //     res.setData(adminService.updateUser(id, request));
    //     return res;
    // }

    @PutMapping("/users/{id}/block")
    public ApiResponse<Void> blockUser(@PathVariable Long id) {
        adminService.blockUser(id);
        ApiResponse<Void> res = new ApiResponse<>();
        res.setMessage("User blocked");
        return res;
    }

    @GetMapping("/tours")
    public ApiResponse<PageResponse<TourResponse>> listTours(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        ApiResponse<PageResponse<TourResponse>> res = new ApiResponse<>();
        res.setData(adminService.listTours(page, size));
        return res;
    }

    @PostMapping("/tour")
    public ApiResponse<TourResponse> create(@RequestBody TourCreateRequest request) {
        ApiResponse<TourResponse> res = new ApiResponse<>();
        res.setData(adminService.createTour(request));
        return res;
    }

    @PutMapping("/tour/{id}")
    public ApiResponse<TourResponse> update(
            @PathVariable Long id, @RequestBody TourUpdateRequest request) {
        ApiResponse<TourResponse> res = new ApiResponse<>();
        res.setData(adminService.updateTour(id, request));
        return res;
    }

    @PutMapping("/tour/{id}/archive")
    public ApiResponse<Void> archive(@PathVariable Long id) {
        adminService.deleteTour(id);
        ApiResponse<Void> res = new ApiResponse<>();
        res.setMessage("Tour archived");
        return res;
    }

    @PostMapping("/destination")
    public ApiResponse<DestinationResponse> createDestination(
            @RequestBody DestinationCreateRequest request) {
        ApiResponse<DestinationResponse> res = new ApiResponse<>();
        res.setData(adminService.createDestination(request));
        return res;
    }

    @PutMapping("/destination/{id}")
    public ApiResponse<DestinationResponse> updateDestination(
            @PathVariable Long id, @RequestBody DestinationUpdateRequest request) {
        ApiResponse<DestinationResponse> res = new ApiResponse<>();
        res.setData(adminService.updateDestination(id, request));
        return res;
    }

    @PostMapping("/payments/{id}/confirm-cod")
    public ApiResponse<PaymentCheckoutResponse> confirmCodCollected(@PathVariable Long id) {
        ApiResponse<PaymentCheckoutResponse> res = new ApiResponse<>();
        res.setData(adminService.confirmCodCollected(id));
        res.setMessage("COD collected and invoice generated");
        return res;
    }

}
