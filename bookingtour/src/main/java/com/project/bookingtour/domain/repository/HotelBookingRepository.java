package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.domain.entity.HotelBooking;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {

    Optional<HotelBooking> findByBookingCode(String bookingCode);

    Optional<HotelBooking> findByIdAndUser_Id(Long id, Long userId);

    Page<HotelBooking> findByUser_Id(Long userId, Pageable pageable);

    List<HotelBooking> findByPaymentMethodAndPaymentStatusOrderByCreatedAtDesc(
            PaymentProvider paymentMethod, BookingPaymentStatus paymentStatus);
}
