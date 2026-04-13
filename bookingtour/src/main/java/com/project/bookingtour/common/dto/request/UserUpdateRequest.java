package com.project.bookingtour.common.dto.request;

import com.project.bookingtour.common.enums.UserStatus;
import lombok.Data;

@Data
public class UserUpdateRequest {

    private String fullName;
    private String email;
    private String phone;
    private String password;
    private Long roleId;
    private UserStatus status;
}
