package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.TourStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class TourCreateRequest {

    private String code;
    private String name;
    private String description;
    private Integer durationDays;
    private List<LocalDate> departureDates;
    private BigDecimal basePrice;
    private String destinationList;
    /** Điểm xuất phát (VD: Ha Noi, TP. Ho Chi Minh, Da Nang). */
    private String departurePoint;
    private List<Long> destinationIds;
    private List<String> imageUrls;
    private List<TourItineraryRequest> itineraries;
    private TourStatus status;
}
