package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.Destination;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DestinationRepository
        extends JpaRepository<Destination, Long>, JpaSpecificationExecutor<Destination> {

    boolean existsByNameAndProvinceAndCountry(String name, String province, String country);

    boolean existsByNameAndProvinceAndCountryAndIdNot(
            String name, String province, String country, Long id);

    /**
     * Điểm đến xuất hiện trong lịch tour (tour_destinations) của các tour có booking (trừ cancelled);
     * đếm số booking — cùng một booking đếm cho mỗi destination trên hành trình tour đó.
     */
    @Query(
            value =
                    """
                    SELECT d.id FROM destinations d
                    LEFT JOIN (
                        SELECT td.destination_id, COUNT(bk.id) AS cnt
                        FROM bookings bk
                        INNER JOIN tour_destinations td ON td.tour_id = bk.tour_id
                        WHERE bk.booking_status <> 'cancelled'
                        GROUP BY td.destination_id
                    ) x ON x.destination_id = d.id
                    ORDER BY COALESCE(x.cnt, 0) DESC, d.id DESC
                    LIMIT :limit
                    """,
            nativeQuery = true)
    List<Long> findIdsOrderByBookingCount(@Param("limit") int limit);
}
