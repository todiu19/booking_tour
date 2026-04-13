package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.TourDestination;
import com.project.bookingtour.domain.entity.TourDestinationId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourDestinationRepository extends JpaRepository<TourDestination, TourDestinationId> {

    List<TourDestination> findByTour_IdOrderByDayNumberAsc(Long tourId);

    void deleteByTour_Id(Long tourId);
}
