package com.project.bookingtour.common.dto.request;

import lombok.Data;

@Data
public class UserPasswordChangeRequest {

    private String currentPassword;
    private String newPassword;
    private String confirmNewPassword;
}
