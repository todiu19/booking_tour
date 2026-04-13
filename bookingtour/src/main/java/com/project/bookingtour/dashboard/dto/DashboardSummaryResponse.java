package com.project.bookingtour.dashboard.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class DashboardSummaryResponse {
    private long totalUsers;
    private long activeUsers;
    private long blockedUsers;

    private long totalTours;
    private long publishedTours;
    private long archivedTours;

    private long totalBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long cancelledBookings;
    private long completedBookings;

    private long totalPayments;
    private long pendingPayments;
    private long successfulPayments;
    private long failedPayments;

    private long successfulVnpayPayments;
    private long successfulCodPayments;
    private BigDecimal successfulRevenue;
}
