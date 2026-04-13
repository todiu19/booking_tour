package com.project.bookingtour.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JsonAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorCode ec = ErrorCode.UNAUTHORIZED;
        ApiResponse<Void> body = new ApiResponse<>();
        body.setCode(ec.getHttpStatus().value());
        body.setErrorCode(ec.getCode());
        body.setMessage(ec.getDefaultMessage());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
