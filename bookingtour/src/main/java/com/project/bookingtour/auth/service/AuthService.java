package com.project.bookingtour.auth.service;

import com.project.bookingtour.common.dto.request.LoginRequest;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.common.dto.request.RegisterRequest;
import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.common.enums.UserStatus;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.UserRepository;
import com.project.bookingtour.security.JwtCookieHelper;
import com.project.bookingtour.security.JwtService;
import com.project.bookingtour.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtCookieHelper jwtCookieHelper;

    @Transactional
    public UserResponse register(RegisterRequest req, HttpServletResponse response) {
        validateRegister(req);
        UserCreateRequest create = new UserCreateRequest();
        create.setFullName(req.getFullName().trim());
        create.setEmail(req.getEmail().trim());
        create.setPhone(req.getPhone().trim());
        create.setPassword(req.getPassword());
        create.setRoleId(null);
        create.setStatus(UserStatus.active);
        UserResponse created = userService.createUser(create);
        User user =
                userRepository
                        .findById(created.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR, "User not found after registration"));
        issueCookie(response, user);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest req, HttpServletResponse response) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "email is required");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "password is required");
        }
        String email = req.getEmail().trim();
        User user =
                userRepository
                        .findByEmailWithRole(email)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (user.getStatus() == UserStatus.blocked) {
            throw new AppException(ErrorCode.ACCOUNT_BLOCKED);
        }
        issueCookie(response, user);
        return UserResponse.from(user);
    }

    public void logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookieHelper.clearAccessTokenCookie().toString());
    }

    private void issueCookie(HttpServletResponse response, User user) {
        String jwt = jwtService.generateToken(user);
        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookieHelper.buildAccessTokenCookie(jwt).toString());
    }

    private void validateRegister(RegisterRequest req) {
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "fullName is required");
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "email is required");
        }
        if (req.getPhone() == null || req.getPhone().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "phone is required");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "password is required");
        }
        if (req.getPassword().length() < MIN_PASSWORD_LENGTH) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST,
                    "password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        if (req.getConfirmPassword() == null || req.getConfirmPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "confirmPassword is required");
        }
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "password and confirmPassword do not match");
        }
    }
}
