package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class HomeRequest {

    private Integer featuredTourLimit;
    private Integer latestTourLimit;
    private Integer topDestinationLimit;
}
