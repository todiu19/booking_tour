package com.project.bookingtour.auth.controller;

import com.project.bookingtour.auth.service.AuthService;
import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.LoginRequest;
import com.project.bookingtour.common.dto.request.RegisterRequest;
import com.project.bookingtour.common.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(
            @RequestBody RegisterRequest request, HttpServletResponse response) {
        ApiResponse<AuthResponse> res = new ApiResponse<>();
        res.setData(AuthResponse.withCookieAuth(authService.register(request, response)));
        return res;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @RequestBody LoginRequest request, HttpServletResponse response) {
        ApiResponse<AuthResponse> res = new ApiResponse<>();
        res.setData(AuthResponse.withCookieAuth(authService.login(request, response)));
        return res;
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {
        authService.logout(response);
        ApiResponse<Void> res = new ApiResponse<>();
        res.setMessage("Logged out");
        return res;
    }
}
