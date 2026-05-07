package com.project.bookingtour.dashboard.service;

import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.common.enums.UserStatus;
import com.project.bookingtour.dashboard.dto.DashboardMonthlyItemResponse;
import com.project.bookingtour.dashboard.dto.DashboardMonthlyResponse;
import com.project.bookingtour.dashboard.dto.DashboardSummaryResponse;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.Payment;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.HotelBookingRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TourRepository tourRepository;
    private final BookingRepository bookingRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final PaymentRepository paymentRepository;

    public DashboardSummaryResponse getSummary() {
        DashboardSummaryResponse response = new DashboardSummaryResponse();

        response.setTotalUsers(userRepository.count());
        response.setActiveUsers(userRepository.countByStatus(UserStatus.active));
        response.setBlockedUsers(userRepository.countByStatus(UserStatus.blocked));

        response.setTotalTours(tourRepository.count());
        response.setPublishedTours(tourRepository.countByStatus(TourStatus.published));
        response.setArchivedTours(tourRepository.countByStatus(TourStatus.archived));

        response.setTotalBookings(bookingRepository.count());
        response.setPendingBookings(bookingRepository.countByBookingStatus(BookingStatus.pending));
        response.setConfirmedBookings(bookingRepository.countByBookingStatus(BookingStatus.confirmed));
        response.setCancelledBookings(bookingRepository.countByBookingStatus(BookingStatus.cancelled));
        response.setCompletedBookings(bookingRepository.countByBookingStatus(BookingStatus.completed));

        response.setTotalPayments(paymentRepository.count());
        response.setPendingPayments(paymentRepository.countByPaymentStatus(PaymentStatus.pending));
        response.setSuccessfulPayments(paymentRepository.countByPaymentStatus(PaymentStatus.success));
        response.setFailedPayments(paymentRepository.countByPaymentStatus(PaymentStatus.failed));
        response.setSuccessfulVnpayPayments(
                paymentRepository.countByProviderAndPaymentStatus(
                        PaymentProvider.vnpay, PaymentStatus.success));
        response.setSuccessfulCodPayments(
                paymentRepository.countByProviderAndPaymentStatus(
                        PaymentProvider.cod, PaymentStatus.success));

        BigDecimal revenue =
                paymentRepository.sumAmountByStatusInRange(PaymentStatus.success, null, null);
        response.setSuccessfulRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        return response;
    }

    public DashboardMonthlyResponse getMonthlyStats(int months) {
        int n = Math.min(Math.max(months, 1), 36);
        YearMonth current = YearMonth.now();
        YearMonth start = current.minusMonths(n - 1L);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        Map<String, DashboardMonthlyItemResponse> buckets = new LinkedHashMap<>();
        List<DashboardMonthlyItemResponse> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            YearMonth ym = start.plusMonths(i);
            DashboardMonthlyItemResponse item = new DashboardMonthlyItemResponse();
            item.setMonth(ym.format(fmt));
            list.add(item);
            buckets.put(item.getMonth(), item);
        }

        for (Booking booking : bookingRepository.findAll()) {
            if (booking.getCreatedAt() == null) continue;
            String key = YearMonth.from(booking.getCreatedAt()).format(fmt);
            DashboardMonthlyItemResponse item = buckets.get(key);
            if (item == null) continue;
            item.setTotalBookings(item.getTotalBookings() + 1);
            item.setTourBookings(item.getTourBookings() + 1);
            if (booking.getBookingStatus() == BookingStatus.cancelled) {
                item.setCancelledBookings(item.getCancelledBookings() + 1);
            }
        }

        for (HotelBooking booking : hotelBookingRepository.findAll()) {
            if (booking.getCreatedAt() == null) continue;
            String key = YearMonth.from(booking.getCreatedAt()).format(fmt);
            DashboardMonthlyItemResponse item = buckets.get(key);
            if (item == null) continue;
            item.setTotalBookings(item.getTotalBookings() + 1);
            item.setHotelBookings(item.getHotelBookings() + 1);
            if (booking.getBookingStatus() == BookingStatus.cancelled) {
                item.setCancelledBookings(item.getCancelledBookings() + 1);
            }
        }

        // Revenue must use the same source as summary: successful payments.
        for (Payment payment : paymentRepository.findAll()) {
            if (payment.getPaymentStatus() != PaymentStatus.success) continue;
            if (payment.getPaidAt() == null) continue;
            String key = YearMonth.from(payment.getPaidAt()).format(fmt);
            DashboardMonthlyItemResponse item = buckets.get(key);
            if (item == null) continue;
            BigDecimal amount = payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount();
            item.setTotalRevenue(item.getTotalRevenue().add(amount));
            if (payment.getBooking() != null) {
                item.setTourRevenue(item.getTourRevenue().add(amount));
            } else if (payment.getHotelBooking() != null) {
                item.setHotelRevenue(item.getHotelRevenue().add(amount));
            }
        }

        DashboardMonthlyResponse response = new DashboardMonthlyResponse();
        response.setItems(list);
        return response;
    }
}
