package com.project.bookingtour.common.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private UserResponse user;

    /** JWT trong cookie HttpOnly {@code access_token}; body chỉ có user. */
    public static AuthResponse withCookieAuth(UserResponse user) {
        AuthResponse r = new AuthResponse();
        r.setUser(user);
        return r;
    }
}
