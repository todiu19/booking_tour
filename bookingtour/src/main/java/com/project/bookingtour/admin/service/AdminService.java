package com.project.bookingtour.admin.service;

import com.project.bookingtour.common.dto.request.DestinationCreateRequest;
import com.project.bookingtour.common.dto.request.DestinationUpdateRequest;
import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.request.UserUpdateRequest;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.destination.service.DestinationService;
import com.project.bookingtour.payment.service.PaymentService;
import com.project.bookingtour.tour.service.TourService;
import com.project.bookingtour.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TourService tourService;
    private final DestinationService destinationService;
    private final UserService userService;
    private final PaymentService paymentService;

    public PageResponse<UserResponse> listUsers(int page, int size) {
        return userService.listUsers(page, size);
    }

    public UserResponse getUser(Long id) {
        return userService.getUser(id);
    }

    public UserResponse createUser(UserCreateRequest request) {
        return userService.createUser(request);
    }

    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        return userService.updateUser(id, request);
    }

    public void blockUser(Long id) {
        userService.blockUser(id);
    }

    public TourResponse createTour(TourCreateRequest request) {
        return tourService.createTour(request);
    }

    public TourResponse updateTour(Long id, TourUpdateRequest request) {
        return tourService.updateTour(id, request);
    }

    public void deleteTour(Long id) {
        tourService.deleteTour(id);
    }

    public PageResponse<TourResponse> listTours(int page, int size) {
        return tourService.listTours(page, size);
    }

    public DestinationResponse createDestination(DestinationCreateRequest request) {
        return destinationService.createDestination(request);
    }

    public DestinationResponse updateDestination(Long id, DestinationUpdateRequest request) {
        return destinationService.updateDestination(id, request);
    }

    public PaymentCheckoutResponse confirmCodCollected(Long paymentId) {
        return paymentService.confirmCodCollected(paymentId);
    }

}
