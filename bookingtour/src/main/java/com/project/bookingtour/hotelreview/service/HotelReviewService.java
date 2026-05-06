package com.project.bookingtour.hotelreview.service;

import com.project.bookingtour.common.dto.request.HotelReviewCreateRequest;
import com.project.bookingtour.common.dto.response.HotelReviewResponse;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.HotelReview;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.HotelBookingRepository;
import com.project.bookingtour.domain.repository.HotelReviewRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HotelReviewService {

    private final HotelBookingRepository hotelBookingRepository;
    private final HotelReviewRepository hotelReviewRepository;
    private final UserRepository userRepository;

    @Transactional
    public HotelReviewResponse createFromHotelBooking(Long userId, HotelReviewCreateRequest req) {
        if (req == null || req.getHotelBookingId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "hotelBookingId is required");
        }
        if (req.getRating() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "rating is required");
        }
        if (req.getRating() < 1 || req.getRating() > 5) {
            throw new AppException(ErrorCode.BAD_REQUEST, "rating must be between 1 and 5");
        }

        HotelBooking booking =
                hotelBookingRepository
                        .findByIdAndUser_Id(req.getHotelBookingId(), userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getBookingStatus() == BookingStatus.cancelled) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot review cancelled hotel bookings");
        }
        LocalDate today = LocalDate.now();
        if (booking.getCheckOutDate() != null && booking.getCheckOutDate().isAfter(today)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "You can only review after check-out date");
        }
        if (hotelReviewRepository.existsByHotelBooking_Id(booking.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "You already reviewed this hotel stay");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Hotel hotel = booking.getHotel();
        if (hotel == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Hotel not found for this booking");
        }

        HotelReview review = new HotelReview();
        review.setHotel(hotel);
        review.setHotelBooking(booking);
        review.setUser(user);
        String name =
                user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getEmail() != null
                                ? user.getEmail()
                                : "User";
        review.setReviewerName(name);
        review.setRating(req.getRating().shortValue());
        review.setComment(req.getComment());
        review.setStatus(ReviewStatus.visible);

        HotelReview saved = hotelReviewRepository.save(review);
        return HotelReviewResponse.from(saved);
    }
}
