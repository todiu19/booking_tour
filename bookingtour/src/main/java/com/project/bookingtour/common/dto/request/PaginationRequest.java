package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class PaginationRequest {

    private Integer page;
    private Integer size;
    private String sort;
}
