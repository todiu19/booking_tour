package com.project.bookingtour.common.dto.response;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class HomeResponse {

    private List<TourResponse> featuredTours;
    private List<TourResponse> latestTours;
    private List<DestinationResponse> topDestinations;
}
