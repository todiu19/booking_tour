package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AdminPaymentItemResponse {

    private Long paymentId;
    private Long bookingId;
    private String bookingCode;
    private String bookingEmail;
    private String tourName;
    private Integer pax;
    private BigDecimal totalAmount;
    private PaymentProvider provider;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private boolean canConfirmCod;

    public static AdminPaymentItemResponse from(Payment payment) {
        AdminPaymentItemResponse r = new AdminPaymentItemResponse();
        Booking booking = payment.getBooking();

        r.setPaymentId(payment.getId());
        r.setBookingId(booking != null ? booking.getId() : null);
        r.setBookingCode(booking != null ? booking.getBookingCode() : null);
        r.setBookingEmail(booking != null ? booking.getContactEmail() : null);
        r.setTourName(booking != null && booking.getTour() != null ? booking.getTour().getName() : null);
        int adult = booking != null && booking.getAdultCount() != null ? booking.getAdultCount() : 0;
        int child = booking != null && booking.getChildCount() != null ? booking.getChildCount() : 0;
        r.setPax(adult + child);
        r.setTotalAmount(booking != null ? booking.getTotalAmount() : null);
        r.setProvider(payment.getProvider());
        r.setPaymentStatus(payment.getPaymentStatus());
        r.setCreatedAt(payment.getCreatedAt());
        r.setCanConfirmCod(payment.getProvider() == PaymentProvider.cod && payment.getPaymentStatus() == PaymentStatus.pending);
        return r;
    }
}
