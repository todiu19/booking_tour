package com.project.bookingtour.user.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.UserPasswordChangeRequest;
import com.project.bookingtour.common.dto.request.UserProfileUpdateRequest;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.security.AppUserDetails;
import com.project.bookingtour.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal AppUserDetails principal) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<UserResponse> res = new ApiResponse<>();
        res.setData(userService.getUser(principal.getId()));
        return res;
    }

    @PutMapping("/update")
    public ApiResponse<UserResponse> updateProfile(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody UserProfileUpdateRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<UserResponse> res = new ApiResponse<>();
        res.setData(userService.updateMyProfile(principal.getId(), request));
        res.setMessage("Profile updated");
        return res;
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody UserPasswordChangeRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        userService.changePassword(principal.getId(), request);
        ApiResponse<Void> res = new ApiResponse<>();
        res.setMessage("Password updated");
        return res;
    }
}
