package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.domain.entity.Booking;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingCode(String bookingCode);

    Optional<Booking> findByIdAndUser_Id(Long id, Long userId);

    Page<Booking> findByUser_Id(Long userId, Pageable pageable);

    boolean existsByUser_Id(Long userId);

    boolean existsByUser_IdAndTour_IdAndPaymentStatusAndBookingStatusNot(
            Long userId,
            Long tourId,
            BookingPaymentStatus paymentStatus,
            BookingStatus bookingStatus);

    long countByBookingStatus(BookingStatus bookingStatus);

    @Query(
            """
            SELECT COALESCE(SUM(b.totalAmount), 0)
            FROM Booking b
            WHERE b.bookingStatus <> :cancelled AND b.paymentStatus = :paid
            """)
    BigDecimal sumTotalAmountPaidExcludingCancelled(
            @Param("cancelled") BookingStatus cancelled, @Param("paid") BookingPaymentStatus paid);
}
