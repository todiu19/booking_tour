package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.domain.entity.Review;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByTour_Id(Long tourId, Pageable pageable);

    Page<Review> findByTour_IdAndStatus(Long tourId, ReviewStatus status, Pageable pageable);

    boolean existsByUser_IdAndTour_Id(Long userId, Long tourId);

    long countByStatus(ReviewStatus status);

    @Query(
            """
            SELECT r.tour.id, AVG(r.rating), COUNT(r.id)
            FROM Review r
            WHERE r.status = :status
              AND r.tour.id IN :tourIds
            GROUP BY r.tour.id
            """)
    List<Object[]> aggregateRatingByTourIds(
            @Param("tourIds") List<Long> tourIds, @Param("status") ReviewStatus status);
}
