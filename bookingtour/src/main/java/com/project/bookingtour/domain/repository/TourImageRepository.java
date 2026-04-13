package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.TourImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourImageRepository extends JpaRepository<TourImage, Long> {

    List<TourImage> findByTour_IdOrderByDisplayOrderAsc(Long tourId);
}
