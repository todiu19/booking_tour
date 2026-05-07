package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.HotelStatus;
import com.project.bookingtour.domain.entity.Hotel;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findAllByDestination_Id(Long destinationId);
    List<Hotel> findAllByStatus(HotelStatus status);
    List<Hotel> findAllByDestination_IdAndStatus(Long destinationId, HotelStatus status);
    Optional<Hotel> findByIdAndStatus(Long id, HotelStatus status);
    Page<Hotel> findAllByStatus(HotelStatus status, Pageable pageable);
}
