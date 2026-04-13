package com.project.bookingtour.common.exception;

import com.project.bookingtour.common.dto.ApiResponse;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        ErrorCode ec = ex.getErrorCode();
        if (ec.getHttpStatus().is5xxServerError()) {
            log.error("[{}] {}", ec.getCode(), ex.getMessage(), ex);
        } else {
            log.debug("[{}] {}", ec.getCode(), ex.getMessage());
        }
        return ResponseEntity.status(ec.getHttpStatus())
                .body(buildError(ec.getHttpStatus().value(), ec.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatusCode statusCode = ex.getStatusCode();
        int code = statusCode.value();
        String message = ex.getReason();
        if (message == null || message.isBlank()) {
            HttpStatus resolved = HttpStatus.resolve(code);
            message =
                    resolved != null ? resolved.getReasonPhrase() : "Request failed";
        }
        HttpStatus status = HttpStatus.resolve(code);
        if (status != null && status.is5xxServerError()) {
            log.error("ResponseStatusException {}: {}", code, message, ex);
        } else {
            log.debug("ResponseStatusException {}: {}", code, message);
        }
        return ResponseEntity.status(statusCode).body(buildError(code, null, message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message =
                ex.getBindingResult().getFieldErrors().stream()
                        .map(err -> err.getField() + ": " + err.getDefaultMessage())
                        .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = ErrorCode.VALIDATION_FAILED.getDefaultMessage();
        }
        log.debug("Validation: {}", message);
        return ResponseEntity.badRequest()
                .body(
                        buildError(
                                HttpStatus.BAD_REQUEST.value(),
                                ErrorCode.VALIDATION_FAILED.getCode(),
                                message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.debug("Invalid JSON: {}", ex.getMessage());
        ErrorCode ec = ErrorCode.INVALID_REQUEST_BODY;
        return ResponseEntity.badRequest()
                .body(
                        buildError(
                                ec.getHttpStatus().value(),
                                ec.getCode(),
                                ec.getDefaultMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        ErrorCode ec = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(ec.getHttpStatus())
                .body(
                        buildError(
                                ec.getHttpStatus().value(),
                                ec.getCode(),
                                ec.getDefaultMessage()));
    }

    private static ApiResponse<Void> buildError(int httpCode, String errorCode, String message) {
        ApiResponse<Void> body = new ApiResponse<>();
        body.setCode(httpCode);
        if (errorCode != null) {
            body.setErrorCode(errorCode);
        }
        body.setMessage(message);
        return body;
    }
}
