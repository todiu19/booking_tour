package com.project.bookingtour.config;
// cấu hình cho cookie chứa JWT, được load từ application.properties hoặc application.yml
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth-cookie")
public record AuthCookieProperties(
        String name, String path, boolean secure, String sameSite, int maxAgeSeconds) {}
