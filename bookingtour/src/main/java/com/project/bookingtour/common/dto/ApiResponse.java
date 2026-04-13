package com.project.bookingtour.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /** HTTP status (hoặc 0 khi thành công). */
    private int code;

    /** Mã lỗi nghiệp vụ (enum {@code ErrorCode#code}); chỉ khi lỗi. */
    private String errorCode;

    private String message;
    private T data;
}
