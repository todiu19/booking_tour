package com.project.bookingtour.home.controller;

import com.project.bookingtour.common.dto.response.HomeResponse;
import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.home.service.HomeService;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Data
@RequestMapping("/home")
public class HomeController {
    private final HomeService homeService;

    @GetMapping
    public ApiResponse<HomeResponse> getHome(@RequestParam(defaultValue = "10") int size) {
        ApiResponse<HomeResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(homeService.getHomeData(size));
        return apiResponse;
    }
}