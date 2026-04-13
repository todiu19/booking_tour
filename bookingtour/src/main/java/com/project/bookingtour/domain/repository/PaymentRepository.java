package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.domain.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionRef(String transactionRef);

    long countByPaymentStatus(PaymentStatus paymentStatus);

    @Query(
            """
            SELECT COUNT(p)
            FROM Payment p
            WHERE p.paymentStatus = :status
              AND (:fromTs IS NULL OR p.paidAt >= :fromTs)
              AND (:toExclusive IS NULL OR p.paidAt < :toExclusive)
            """)
    long countByStatusInRange(
            @Param("status") PaymentStatus status,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toExclusive") LocalDateTime toExclusive);

    long countByProviderAndPaymentStatus(PaymentProvider provider, PaymentStatus paymentStatus);

    @Query(
            """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM Payment p
            WHERE p.paymentStatus = :status
              AND (:fromTs IS NULL OR p.paidAt >= :fromTs)
              AND (:toExclusive IS NULL OR p.paidAt < :toExclusive)
            """)
    BigDecimal sumAmountByStatusInRange(
            @Param("status") PaymentStatus status,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toExclusive") LocalDateTime toExclusive);

    @Query(
            value =
                    """
                    SELECT DATE(p.paid_at) AS day, COALESCE(SUM(p.amount), 0) AS revenue, COUNT(*) AS cnt
                    FROM payments p
                    WHERE p.payment_status = 'success'
                      AND (:fromTs IS NULL OR p.paid_at >= :fromTs)
                      AND (:toExclusive IS NULL OR p.paid_at < :toExclusive)
                    GROUP BY DATE(p.paid_at)
                    ORDER BY DATE(p.paid_at) ASC
                    """,
            nativeQuery = true)
    List<DailyRevenueRow> findDailyRevenue(
            @Param("fromTs") LocalDateTime fromTs, @Param("toExclusive") LocalDateTime toExclusive);

    interface DailyRevenueRow {
        String getDay();

        BigDecimal getRevenue();

        Long getCnt();
    }
}
