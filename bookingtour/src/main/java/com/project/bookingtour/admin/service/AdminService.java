package com.project.bookingtour.admin.service;

import com.project.bookingtour.common.dto.request.DestinationCreateRequest;
import com.project.bookingtour.common.dto.request.DestinationUpdateRequest;
import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.request.UserUpdateRequest;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.AdminPaymentItemResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.dto.response.PaymentResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.destination.service.DestinationService;
import com.project.bookingtour.payment.service.PaymentService;
import com.project.bookingtour.tour.service.TourService;
import com.project.bookingtour.user.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    public TourResponse createTour(TourCreateRequest request, List<MultipartFile> files) {
        return tourService.createTour(request, files);
    }

    public TourResponse updateTour(Long id, TourUpdateRequest request) {
        return tourService.updateTour(id, request);
    }

    public TourResponse updateTour(Long id, TourUpdateRequest request, List<MultipartFile> files) {
        return tourService.updateTour(id, request, files);
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

    public List<PaymentResponse> listPendingCodPayments() {
        return paymentService.listPendingCodPayments();
    }

    public List<AdminPaymentItemResponse> listPaymentsForAdmin() {
        return paymentService.listPaymentsForAdmin();
    }

}
