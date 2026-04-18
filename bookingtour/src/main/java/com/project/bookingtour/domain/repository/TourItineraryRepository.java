package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.TourItinerary;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourItineraryRepository extends JpaRepository<TourItinerary, Long> {

    void deleteByTour_Id(Long tourId);

    @EntityGraph(attributePaths = {"itineraryHotels", "itineraryHotels.hotel"})
    List<TourItinerary> findByTour_IdOrderByDayNumberAsc(Long tourId);
}
