package com.project.bookingtour.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth-cookie")
public record AuthCookieProperties(
        String name, String path, boolean secure, String sameSite, int maxAgeSeconds) {}
