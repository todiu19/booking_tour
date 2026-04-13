package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.Destination;
import lombok.Data;

@Data
public class DestinationResponse {

    private Long id;
    private String name;
    private String province;
    private String country;
    private String imageUrl;

    public static DestinationResponse from(Destination d) {
        if (d == null) {
            return null;
        }
        DestinationResponse r = new DestinationResponse();
        r.setId(d.getId());
        r.setName(d.getName());
        r.setProvince(d.getProvince());
        r.setCountry(d.getCountry());
        r.setImageUrl(d.getImageUrl());
        return r;
    }
}
