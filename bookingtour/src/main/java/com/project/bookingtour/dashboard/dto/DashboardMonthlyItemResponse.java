package com.project.bookingtour.dashboard.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class DashboardMonthlyItemResponse {
    private String month; // yyyy-MM
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private BigDecimal tourRevenue = BigDecimal.ZERO;
    private BigDecimal hotelRevenue = BigDecimal.ZERO;
    private Long totalBookings = 0L;
    private Long cancelledBookings = 0L;
    private Long tourBookings = 0L;
    private Long hotelBookings = 0L;
}
