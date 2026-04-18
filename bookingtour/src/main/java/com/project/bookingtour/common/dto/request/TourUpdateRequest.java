package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.TourStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class TourUpdateRequest {

    private String code;
    private String name;
    private String description;
    private Integer durationDays;
    private LocalDate departureDate;
    private BigDecimal basePrice;
    private String destinationList;
    private List<Long> destinationIds;
    private List<TourItineraryRequest> itineraries;
    private TourStatus status;
}
