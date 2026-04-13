package com.project.bookingtour.common.exception;

import lombok.Getter;

/**
 * Lỗi nghiệp vụ có {@link ErrorCode}; message có thể ghi đè so với {@link ErrorCode#getDefaultMessage()}.
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String message) {
        super(message != null && !message.isBlank() ? message : errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String message, Throwable cause) {
        super(message != null && !message.isBlank() ? message : errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }
}
