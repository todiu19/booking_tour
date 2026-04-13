package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.domain.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByTour_Id(Long tourId, Pageable pageable);

    boolean existsByUser_IdAndTour_Id(Long userId, Long tourId);

    long countByStatus(ReviewStatus status);
}
