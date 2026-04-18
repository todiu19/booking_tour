package com.project.bookingtour.review.service;

import com.project.bookingtour.common.dto.request.ReviewCreateRequest;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.ReviewResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Review;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.ReviewRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final TourRepository tourRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getVisibleReviewsByTour(Long tourId, int page, int size) {
        if (tourId == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "tourId is required");
        }
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<Review> result =
                reviewRepository.findByTour_IdAndStatus(tourId, ReviewStatus.visible, pageable);
        return PageResponse.fromPage(result.map(ReviewResponse::from));
    }

    @Transactional
    public ReviewResponse createMyReview(Long userId, ReviewCreateRequest req) {
        if (req.getTourId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "tourId is required");
        }
        if (req.getRating() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "rating is required");
        }
        if (req.getRating() < 1 || req.getRating() > 5) {
            throw new AppException(ErrorCode.BAD_REQUEST, "rating must be between 1 and 5");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Tour tour =
                tourRepository
                        .findById(req.getTourId())
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        boolean eligible =
                bookingRepository.existsByUser_IdAndTour_IdAndPaymentStatusAndBookingStatusNot(
                        userId, tour.getId(), BookingPaymentStatus.paid, BookingStatus.cancelled);
        if (!eligible) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Only paid bookings can be reviewed");
        }
        if (reviewRepository.existsByUser_IdAndTour_Id(userId, tour.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "You already reviewed this tour");
        }

        Review review = new Review();
        review.setTour(tour);
        review.setUser(user);
        review.setReviewerName(user.getFullName());
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        review.setStatus(ReviewStatus.visible);
        return ReviewResponse.from(reviewRepository.save(review));
    }
}
