package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.TourDeparture;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourDepartureRepository extends JpaRepository<TourDeparture, Long> {

    void deleteByTour_Id(Long tourId);

    List<TourDeparture> findByTour_IdOrderByDepartureDateAsc(Long tourId);

    List<TourDeparture> findByTour_IdInOrderByDepartureDateAsc(java.util.Collection<Long> tourIds);
}
