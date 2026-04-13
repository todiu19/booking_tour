package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.TourDestination;
import lombok.Data;

@Data
public class TourDestinationResponse {

    private Long destinationId;
    private Integer dayNumber;
    private DestinationResponse destination;

    public static TourDestinationResponse from(TourDestination td) {
        if (td == null) {
            return null;
        }
        TourDestinationResponse r = new TourDestinationResponse();
        if (td.getDestination() != null) {
            r.setDestinationId(td.getDestination().getId());
            r.setDestination(DestinationResponse.from(td.getDestination()));
        } else if (td.getId() != null) {
            r.setDestinationId(td.getId().getDestinationId());
        }
        r.setDayNumber(td.getDayNumber());
        return r;
    }
}
