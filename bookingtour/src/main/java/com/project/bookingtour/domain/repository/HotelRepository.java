package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.Hotel;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findAllByDestination_Id(Long destinationId);
}
