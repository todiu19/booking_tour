package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AdminPaymentItemResponse {

    private Long paymentId;
    private Long bookingId;
    private Long hotelBookingId;
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
        HotelBooking hotelBooking = payment.getHotelBooking();

        r.setPaymentId(payment.getId());
        r.setBookingId(booking != null ? booking.getId() : null);
        r.setHotelBookingId(hotelBooking != null ? hotelBooking.getId() : null);
        r.setBookingCode(
                booking != null
                        ? booking.getBookingCode()
                        : hotelBooking != null ? hotelBooking.getBookingCode() : null);
        r.setBookingEmail(
                booking != null
                        ? booking.getContactEmail()
                        : hotelBooking != null ? hotelBooking.getContactEmail() : null);
        r.setTourName(booking != null && booking.getTour() != null ? booking.getTour().getName() : null);
        int adult = booking != null && booking.getAdultCount() != null ? booking.getAdultCount() : 0;
        int child = booking != null && booking.getChildCount() != null ? booking.getChildCount() : 0;
        int guest = hotelBooking != null && hotelBooking.getGuestCount() != null ? hotelBooking.getGuestCount() : 0;
        r.setPax(booking != null ? adult + child : guest);
        r.setTotalAmount(
                booking != null
                        ? booking.getTotalAmount()
                        : hotelBooking != null ? hotelBooking.getTotalAmount() : payment.getAmount());
        r.setProvider(payment.getProvider());
        r.setPaymentStatus(payment.getPaymentStatus());
        r.setCreatedAt(payment.getCreatedAt());
        r.setCanConfirmCod(
                payment.getProvider() == PaymentProvider.cod
                        && payment.getPaymentStatus() == PaymentStatus.pending
                        && booking != null);
        return r;
    }
}
