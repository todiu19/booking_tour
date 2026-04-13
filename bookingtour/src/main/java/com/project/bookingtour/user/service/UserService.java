package com.project.bookingtour.user.service;

import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.request.UserPasswordChangeRequest;
import com.project.bookingtour.common.dto.request.UserProfileUpdateRequest;
import com.project.bookingtour.common.dto.request.UserUpdateRequest;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.common.enums.UserStatus;
import com.project.bookingtour.domain.entity.Role;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.repository.RoleRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_ROLE_NAME = "customer";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listUsers(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<User> result = userRepository.findAll(pr);
        return PageResponse.fromPage(result.map(UserResponse::from));
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        return userRepository
                .findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest req) {
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
        String email = req.getEmail().trim();
        String phone = req.getPhone().trim();
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByPhone(phone)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
        Role role = resolveRoleForCreate(req.getRoleId());
        User user = new User();
        user.setFullName(req.getFullName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setStatus(req.getStatus() != null ? req.getStatus() : UserStatus.active);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest req) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (req.getFullName() != null) {
            if (req.getFullName().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "fullName cannot be blank");
            }
            user.setFullName(req.getFullName().trim());
        }
        if (req.getEmail() != null) {
            if (req.getEmail().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "email cannot be blank");
            }
            String email = req.getEmail().trim();
            if (userRepository.existsByEmailAndIdNot(email, id)) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            user.setEmail(email);
        }
        if (req.getPhone() != null) {
            if (req.getPhone().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "phone cannot be blank");
            }
            String phone = req.getPhone().trim();
            if (userRepository.existsByPhoneAndIdNot(phone, id)) {
                throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
            }
            user.setPhone(phone);
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRoleId() != null) {
            Role role =
                    roleRepository
                            .findById(req.getRoleId())
                            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(role);
        }
        if (req.getStatus() != null) {
            user.setStatus(req.getStatus());
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateMyProfile(Long id, UserProfileUpdateRequest req) {
        boolean hasFullName = req.getFullName() != null && !req.getFullName().isBlank();
        boolean hasEmail = req.getEmail() != null && !req.getEmail().isBlank();
        boolean hasPhone = req.getPhone() != null && !req.getPhone().isBlank();
        if (!hasFullName && !hasEmail && !hasPhone) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST, "At least one of fullName, email, phone must be provided");
        }
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (req.getFullName() != null) {
            if (req.getFullName().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "fullName cannot be blank");
            }
            user.setFullName(req.getFullName().trim());
        }
        if (req.getEmail() != null) {
            if (req.getEmail().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "email cannot be blank");
            }
            String email = req.getEmail().trim();
            if (userRepository.existsByEmailAndIdNot(email, id)) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            user.setEmail(email);
        }
        if (req.getPhone() != null) {
            if (req.getPhone().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "phone cannot be blank");
            }
            String phone = req.getPhone().trim();
            if (userRepository.existsByPhoneAndIdNot(phone, id)) {
                throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
            }
            user.setPhone(phone);
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long id, UserPasswordChangeRequest req) {
        if (req.getCurrentPassword() == null || req.getCurrentPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "currentPassword is required");
        }
        if (req.getNewPassword() == null || req.getNewPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "newPassword is required");
        }
        if (req.getConfirmNewPassword() == null || req.getConfirmNewPassword().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "confirmNewPassword is required");
        }
        if (!req.getNewPassword().equals(req.getConfirmNewPassword())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "newPassword and confirmNewPassword do not match");
        }
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    private Role resolveRoleForCreate(Long roleId) {
        if (roleId != null) {
            return roleRepository
                    .findById(roleId)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        }
        return roleRepository
                .findByName(DEFAULT_ROLE_NAME)
                .orElseThrow(
                        () ->
                                new AppException(
                                        ErrorCode.DEFAULT_ROLE_MISSING,
                                        "Default role '" + DEFAULT_ROLE_NAME + "' not found in database"));
    }

    @Transactional
    public void blockUser(Long id) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(UserStatus.blocked);
        userRepository.save(user);
    }
}
