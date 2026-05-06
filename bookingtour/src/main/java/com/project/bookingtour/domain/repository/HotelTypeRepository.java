package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.HotelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelTypeRepository extends JpaRepository<HotelType, Long> {}
