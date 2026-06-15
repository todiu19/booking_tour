package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.domain.entity.HotelBooking;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HotelBookingResponse {

    private Long id;
    private String bookingCode;
    private Long userId;
    private Long hotelId;
    private String hotelName;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer roomCount;
    private Integer guestCount;
    private BigDecimal totalAmount;
    private BookingStatus bookingStatus;
    private BookingPaymentStatus paymentStatus;
    private PaymentProvider paymentMethod;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long invoiceId;
    private boolean canViewInvoice;
    private String paymentUrl;
    /** true if user already submitted an order-linked review for this booking */
    private boolean reviewed;

    public static HotelBookingResponse from(HotelBooking booking) {
        return from(booking, false, null, false);
    }

    public static HotelBookingResponse from(HotelBooking booking, boolean reviewed) {
        return from(booking, reviewed, null, false);
    }

    public static HotelBookingResponse from(
            HotelBooking booking, boolean reviewed, Long invoiceId, boolean canViewInvoice) {
        if (booking == null) return null;
        HotelBookingResponse r = new HotelBookingResponse();
        r.setReviewed(reviewed);
        r.setInvoiceId(invoiceId);
        r.setCanViewInvoice(canViewInvoice);
        r.setId(booking.getId());
        r.setBookingCode(booking.getBookingCode());
        r.setUserId(booking.getUser() != null ? booking.getUser().getId() : null);
        r.setHotelId(booking.getHotel() != null ? booking.getHotel().getId() : null);
        r.setHotelName(booking.getHotel() != null ? booking.getHotel().getName() : null);
        r.setContactName(booking.getContactName());
        r.setContactPhone(booking.getContactPhone());
        r.setContactEmail(booking.getContactEmail());
        r.setCheckInDate(booking.getCheckInDate());
        r.setCheckOutDate(booking.getCheckOutDate());
        r.setRoomCount(booking.getRoomCount());
        r.setGuestCount(booking.getGuestCount());
        r.setTotalAmount(booking.getTotalAmount());
        r.setBookingStatus(booking.getBookingStatus());
        r.setPaymentStatus(booking.getPaymentStatus());
        r.setPaymentMethod(booking.getPaymentMethod());
        r.setNote(booking.getNote());
        r.setCreatedAt(booking.getCreatedAt());
        r.setUpdatedAt(booking.getUpdatedAt());
        return r;
    }
}
