package com.project.bookingtour.common.dto.request;

import lombok.Data;

/** Cập nhật thông tin cá nhân (không đổi mật khẩu, role, trạng thái). */
@Data
public class UserProfileUpdateRequest {

    private String fullName;
    private String email;
    private String phone;
}
