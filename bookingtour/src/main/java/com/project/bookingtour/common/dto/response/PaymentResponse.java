package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.domain.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class PaymentResponse {

    private Long id;
    private Long bookingId;
    private PaymentProvider provider;
    private String transactionRef;
    private BigDecimal amount;
    private PaymentStatus paymentStatus;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentResponse from(Payment p) {
        if (p == null) {
            return null;
        }
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setBookingId(p.getBooking() != null ? p.getBooking().getId() : null);
        r.setProvider(p.getProvider());
        r.setTransactionRef(p.getTransactionRef());
        r.setAmount(p.getAmount());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setPaidAt(p.getPaidAt());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
