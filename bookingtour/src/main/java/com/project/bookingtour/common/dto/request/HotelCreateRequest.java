package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.HotelStatus;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class HotelCreateRequest {
    private String name;
    private String address;
    private String location;
    private String description;
    private BigDecimal basePrice;
    private Integer roomCapacity;
    private Long destinationId;
    private Long hotelTypeId;
    private List<String> imageUrls;
    private HotelStatus status;
}
