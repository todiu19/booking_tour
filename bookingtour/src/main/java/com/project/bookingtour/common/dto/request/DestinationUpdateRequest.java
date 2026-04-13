package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class DestinationUpdateRequest {

    private String name;
    private String province;
    private String country;
    private String imageUrl;
}
