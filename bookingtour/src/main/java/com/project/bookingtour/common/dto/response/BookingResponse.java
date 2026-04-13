package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.domain.entity.Booking;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class BookingResponse {

    private Long id;
    private String bookingCode;
    private Long userId;
    private Long tourId;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private Integer adultCount;
    private Integer childCount;
    private BigDecimal totalAmount;
    private BookingStatus bookingStatus;
    private BookingPaymentStatus paymentStatus;
    /** Có hóa đơn thì frontend có thể cho bấm xem ngay trong history. */
    private Long invoiceId;
    private boolean canViewInvoice;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse from(Booking b) {
        if (b == null) {
            return null;
        }
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setBookingCode(b.getBookingCode());
        r.setUserId(b.getUser() != null ? b.getUser().getId() : null);
        r.setTourId(b.getTour() != null ? b.getTour().getId() : null);
        r.setContactName(b.getContactName());
        r.setContactPhone(b.getContactPhone());
        r.setContactEmail(b.getContactEmail());
        r.setAdultCount(b.getAdultCount());
        r.setChildCount(b.getChildCount());
        r.setTotalAmount(b.getTotalAmount());
        r.setBookingStatus(b.getBookingStatus());
        r.setPaymentStatus(b.getPaymentStatus());
        r.setNote(b.getNote());
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        return r;
    }
}
