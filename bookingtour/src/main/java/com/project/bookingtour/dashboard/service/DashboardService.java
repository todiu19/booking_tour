package com.project.bookingtour.dashboard.service;

import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.common.enums.UserStatus;
import com.project.bookingtour.dashboard.dto.DashboardSummaryResponse;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TourRepository tourRepository;
    private final BookingRepository bookingRepository;
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
}
