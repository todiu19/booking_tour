package com.project.bookingtour.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Mã lỗi nghiệp vụ: {@link #code} cho client, {@link #defaultMessage} mặc định, {@link #httpStatus}
 * map HTTP.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    BAD_REQUEST(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Invalid request"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation failed"),
    INVALID_REQUEST_BODY(HttpStatus.BAD_REQUEST, "INVALID_REQUEST_BODY", "Invalid request body"),

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password"),
    INVALID_CURRENT_PASSWORD(
            HttpStatus.UNAUTHORIZED, "INVALID_CURRENT_PASSWORD", "Current password is incorrect"),

    FORBIDDEN(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden"),
    ACCOUNT_BLOCKED(HttpStatus.FORBIDDEN, "ACCOUNT_BLOCKED", "Account is blocked"),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"),
    BOOKING_NOT_FOUND(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND", "Booking not found"),
    TOUR_NOT_FOUND(HttpStatus.NOT_FOUND, "TOUR_NOT_FOUND", "Tour not found"),
    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Role not found"),
    DESTINATION_NOT_FOUND(HttpStatus.NOT_FOUND, "DESTINATION_NOT_FOUND", "Destination not found"),
    TOUR_SCHEDULE_NOT_FOUND(HttpStatus.NOT_FOUND, "TOUR_SCHEDULE_NOT_FOUND", "Tour schedule not found"),
    INVOICE_NOT_FOUND(HttpStatus.NOT_FOUND, "INVOICE_NOT_FOUND", "Invoice not found"),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment not found"),

    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email already exists"),
    PHONE_ALREADY_EXISTS(HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS", "Phone already exists"),
    TOUR_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "TOUR_CODE_ALREADY_EXISTS", "Tour code already exists"),
    DESTINATION_ALREADY_EXISTS(
            HttpStatus.CONFLICT,
            "DESTINATION_ALREADY_EXISTS",
            "Destination with same name, province and country exists"),
    NOT_ENOUGH_SLOTS(HttpStatus.CONFLICT, "NOT_ENOUGH_SLOTS", "Not enough available slots"),
    SCHEDULE_NOT_OPEN(HttpStatus.BAD_REQUEST, "SCHEDULE_NOT_OPEN", "Tour schedule is not open for booking"),
    BOOKING_ALREADY_CANCELLED(
            HttpStatus.BAD_REQUEST, "BOOKING_ALREADY_CANCELLED", "Booking is already cancelled"),
    BOOKING_ALREADY_PAID(
            HttpStatus.BAD_REQUEST, "BOOKING_ALREADY_PAID", "Paid booking cannot be cancelled"),
    BOOKING_CANNOT_CANCEL(
            HttpStatus.BAD_REQUEST, "BOOKING_CANNOT_CANCEL", "Booking cannot be cancelled at this stage"),
    PAYMENT_PROVIDER_REQUIRED(
            HttpStatus.BAD_REQUEST, "PAYMENT_PROVIDER_REQUIRED", "Payment provider is required"),
    PAYMENT_PROVIDER_INVALID(
            HttpStatus.BAD_REQUEST, "PAYMENT_PROVIDER_INVALID", "Payment provider is invalid for this action"),
    PAYMENT_NOT_PENDING(
            HttpStatus.BAD_REQUEST, "PAYMENT_NOT_PENDING", "Payment is not in pending state"),
    VNPAY_INVALID_SIGNATURE(
            HttpStatus.BAD_REQUEST, "VNPAY_INVALID_SIGNATURE", "Invalid VNPay signature"),
    VNPAY_INVALID_AMOUNT(HttpStatus.BAD_REQUEST, "VNPAY_INVALID_AMOUNT", "Invalid VNPay amount"),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Internal server error"),
    DEFAULT_ROLE_MISSING(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "DEFAULT_ROLE_MISSING",
            "Default role not found in database");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;
}
