package com.project.bookingtour.dashboard.controller;

import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.dashboard.dto.DashboardSummaryResponse;
import com.project.bookingtour.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<DashboardSummaryResponse> getDashboardSummary() {
        ApiResponse<DashboardSummaryResponse> res = new ApiResponse<>();
        res.setData(dashboardService.getSummary());
        return res;
    }
}
