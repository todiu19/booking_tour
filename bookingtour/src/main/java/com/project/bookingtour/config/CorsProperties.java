package com.project.bookingtour.config;
// cấu hình cho CORS, được load từ application.properties hoặc application.yml
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {}
