package com.project.bookingtour.config;
//cấu hình cho Vnpay, được load từ application.properties hoặc application.yml
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.vnpay")
public record VnpayProperties(
        String tmnCode,
        String hashSecret,
        String payUrl,
        String returnUrl,
        String ipnUrl,
        String locale,
        String currCode,
        int expireMinutes) {}
