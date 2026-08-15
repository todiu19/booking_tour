package com.project.bookingtour.config;
// cấu hình cho JWT, được load từ application.properties hoặc application.yml
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationMs) {}
