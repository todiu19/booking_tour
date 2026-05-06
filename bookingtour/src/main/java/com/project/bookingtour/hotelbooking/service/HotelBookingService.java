package com.project.bookingtour.hotelbooking.service;

import com.project.bookingtour.common.dto.request.HotelBookingCreateRequest;
import com.project.bookingtour.common.dto.response.HotelBookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.HotelBookingRepository;
import com.project.bookingtour.domain.repository.HotelRepository;
import com.project.bookingtour.domain.repository.HotelReviewRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.util.HashSet;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HotelBookingService {

    private final HotelBookingRepository hotelBookingRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final HotelReviewRepository hotelReviewRepository;

    @Transactional(readOnly = true)
    public PageResponse<HotelBookingResponse> listMyBookings(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<HotelBooking> raw = hotelBookingRepository.findByUser_Id(userId, pageable);
        java.util.List<Long> ids = raw.getContent().stream().map(HotelBooking::getId).toList();
        java.util.Set<Long> reviewedIds = new HashSet<>();
        if (!ids.isEmpty()) {
            reviewedIds.addAll(hotelReviewRepository.findReviewedBookingIds(ids));
        }
        java.util.Set<Long> finalReviewed = reviewedIds;
        Page<HotelBookingResponse> mapped =
                raw.map(b -> HotelBookingResponse.from(b, finalReviewed.contains(b.getId())));
        return PageResponse.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public HotelBookingResponse getMyBooking(Long userId, Long bookingId) {
        HotelBooking booking =
                hotelBookingRepository
                        .findByIdAndUser_Id(bookingId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        return HotelBookingResponse.from(
                booking, hotelReviewRepository.existsByHotelBooking_Id(booking.getId()));
    }

    @Transactional
    public HotelBookingResponse createBooking(Long userId, HotelBookingCreateRequest req) {
        if (req.getHotelId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "hotelId is required");
        }
        if (req.getCheckInDate() == null || req.getCheckOutDate() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "checkInDate/checkOutDate are required");
        }
        if (!req.getCheckOutDate().isAfter(req.getCheckInDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "checkOutDate must be after checkInDate");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Hotel hotel =
                hotelRepository
                        .findById(req.getHotelId())
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel not found"));

        String contactName =
                req.getContactName() != null && !req.getContactName().isBlank()
                        ? req.getContactName().trim()
                        : user.getFullName();
        String contactPhone =
                req.getContactPhone() != null && !req.getContactPhone().isBlank()
                        ? req.getContactPhone().trim()
                        : user.getPhone();
        String contactEmail =
                req.getContactEmail() != null && !req.getContactEmail().isBlank()
                        ? req.getContactEmail().trim()
                        : user.getEmail();
        if (contactName == null || contactName.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactName is required");
        }
        if (contactPhone == null || contactPhone.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactPhone is required");
        }
        if (contactEmail == null || contactEmail.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactEmail is required");
        }

        int roomCount = req.getRoomCount() == null ? 1 : Math.max(req.getRoomCount(), 1);
        int guestCount = req.getGuestCount() == null ? 1 : Math.max(req.getGuestCount(), 1);
        long nights = Math.max(req.getCheckOutDate().toEpochDay() - req.getCheckInDate().toEpochDay(), 1L);
        BigDecimal basePrice = hotel.getBasePrice() == null ? BigDecimal.ZERO : hotel.getBasePrice();
        BigDecimal total = basePrice.multiply(BigDecimal.valueOf(nights)).multiply(BigDecimal.valueOf(roomCount));

        HotelBooking booking = new HotelBooking();
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setHotel(hotel);
        booking.setContactName(contactName);
        booking.setContactPhone(contactPhone);
        booking.setContactEmail(contactEmail);
        booking.setCheckInDate(req.getCheckInDate());
        booking.setCheckOutDate(req.getCheckOutDate());
        booking.setRoomCount(roomCount);
        booking.setGuestCount(guestCount);
        booking.setTotalAmount(total);
        booking.setBookingStatus(BookingStatus.pending);
        booking.setPaymentStatus(BookingPaymentStatus.unpaid);
        booking.setNote(req.getNote());

        HotelBooking saved = hotelBookingRepository.save(booking);
        return HotelBookingResponse.from(saved);
    }

    @Transactional
    public HotelBookingResponse cancelMyBooking(Long userId, Long bookingId) {
        HotelBooking booking =
                hotelBookingRepository
                        .findByIdAndUser_Id(bookingId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getBookingStatus() == BookingStatus.cancelled) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_CANCELLED);
        }
        if (booking.getBookingStatus() == BookingStatus.completed) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CANCEL);
        }
        if (booking.getPaymentStatus() == BookingPaymentStatus.paid) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_PAID);
        }

        booking.setBookingStatus(BookingStatus.cancelled);
        hotelBookingRepository.save(booking);
        return HotelBookingResponse.from(booking);
    }

    private String generateBookingCode() {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate = "HB" + prefix + ThreadLocalRandom.current().nextInt(100, 1000);
            if (hotelBookingRepository.findByBookingCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate hotel booking code");
    }
}
