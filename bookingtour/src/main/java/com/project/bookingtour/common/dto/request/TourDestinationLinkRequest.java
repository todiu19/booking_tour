package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class TourDestinationLinkRequest {

    private Long destinationId;
    private Integer dayNumber;
}
