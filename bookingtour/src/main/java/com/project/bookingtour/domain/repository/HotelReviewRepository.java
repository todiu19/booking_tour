package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.HotelReview;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelReviewRepository extends JpaRepository<HotelReview, Long> {

    boolean existsByHotelBooking_Id(Long hotelBookingId);

    @Query("select hb.id from HotelReview hr join hr.hotelBooking hb where hb.id in :ids")
    List<Long> findReviewedBookingIds(@Param("ids") Collection<Long> ids);
}
