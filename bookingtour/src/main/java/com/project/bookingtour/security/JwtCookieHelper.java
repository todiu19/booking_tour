package com.project.bookingtour.security;

import com.project.bookingtour.config.AuthCookieProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtCookieHelper {

    private final AuthCookieProperties cookieProps;

    public ResponseCookie buildAccessTokenCookie(String jwtValue) {
        return ResponseCookie.from(cookieProps.name(), jwtValue)
                .httpOnly(true)
                .secure(cookieProps.secure())
                .path(cookieProps.path())
                .maxAge(cookieProps.maxAgeSeconds())
                .sameSite(cookieProps.sameSite())
                .build();
    }

    public ResponseCookie clearAccessTokenCookie() {
        return ResponseCookie.from(cookieProps.name(), "")
                .httpOnly(true)
                .secure(cookieProps.secure())
                .path(cookieProps.path())
                .maxAge(0)
                .sameSite(cookieProps.sameSite())
                .build();
    }
}
