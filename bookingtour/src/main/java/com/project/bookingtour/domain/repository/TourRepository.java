package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.Tour;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TourRepository extends JpaRepository<Tour, Long>, JpaSpecificationExecutor<Tour> {

    Optional<Tour> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    Page<Tour> findByStatus(TourStatus status, Pageable pageable);

    @Query(
            """
            SELECT t
            FROM Tour t
            JOIN TourDestination td ON td.tour.id = t.id
            WHERE td.destination.id = :destinationId
              AND t.status = :status
            """)
    Page<Tour> findPublishedByDestinationId(
            @Param("destinationId") Long destinationId,
            @Param("status") TourStatus status,
            Pageable pageable);

    long countByStatus(TourStatus status);

    /**
     * Tour published, ưu tiên: điểm TB review (visible) giảm dần, sau đó số booking (không tính
     * cancelled) giảm dần, cuối cùng id giảm dần.
     */
    @Query(
            value =
                    """
                    SELECT t.id FROM tours t
                    LEFT JOIN (
                        SELECT tour_id, AVG(rating) AS avgr
                        FROM reviews
                        WHERE status = 'visible'
                        GROUP BY tour_id
                    ) r ON r.tour_id = t.id
                    LEFT JOIN (
                        SELECT bk.tour_id, COUNT(bk.id) AS cnt
                        FROM bookings bk
                        WHERE bk.booking_status <> 'cancelled'
                        GROUP BY bk.tour_id
                    ) b ON b.tour_id = t.id
                    WHERE t.status = 'published'
                    ORDER BY COALESCE(r.avgr, 0) DESC, COALESCE(b.cnt, 0) DESC, t.id DESC
                    LIMIT :limit
                    """,
            nativeQuery = true)
    List<Long> findPublishedIdsOrderByAvgRatingAndBookingCount(@Param("limit") int limit);
}
