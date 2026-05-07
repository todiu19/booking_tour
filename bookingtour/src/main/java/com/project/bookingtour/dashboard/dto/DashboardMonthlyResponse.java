package com.project.bookingtour.dashboard.dto;

import java.util.List;
import lombok.Data;

@Data
public class DashboardMonthlyResponse {
    private List<DashboardMonthlyItemResponse> items;
}
