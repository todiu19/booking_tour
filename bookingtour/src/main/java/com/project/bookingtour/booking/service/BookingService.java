package com.project.bookingtour.booking.service;

import com.project.bookingtour.common.dto.request.BookingCreateRequest;
import com.project.bookingtour.common.dto.response.BookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TourRepository tourRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> listMyBookings(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<Booking> result = bookingRepository.findByUser_Id(userId, pageable);
        List<Long> bookingIds = result.getContent().stream().map(Booking::getId).toList();
        Map<Long, Invoice> invoiceByBookingId =
                bookingIds.isEmpty()
                        ? Map.of()
                        : invoiceRepository.findByBooking_IdIn(bookingIds).stream()
                                .collect(Collectors.toMap(i -> i.getBooking().getId(), i -> i));

        Page<BookingResponse> mapped =
                result.map(
                        b -> {
                            BookingResponse r = BookingResponse.from(b);
                            Invoice inv = invoiceByBookingId.get(b.getId());
                            if (inv != null) {
                                r.setInvoiceId(inv.getId());
                            }
                            r.setCanViewInvoice(b.getPaymentStatus() == BookingPaymentStatus.paid);
                            return r;
                        });
        return PageResponse.fromPage(mapped);
    }

    @Transactional
    public BookingResponse createBooking(Long userId, BookingCreateRequest req) {
        if (req.getTourId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "tourId is required");
        }
        if (req.getContactName() == null || req.getContactName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactName is required");
        }
        if (req.getContactPhone() == null || req.getContactPhone().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactPhone is required");
        }
        if (req.getContactEmail() == null || req.getContactEmail().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "contactEmail is required");
        }

        int adult = req.getAdultCount() == null ? 0 : req.getAdultCount();
        int child = req.getChildCount() == null ? 0 : req.getChildCount();
        int passengers = adult + child;
        if (passengers <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "At least one passenger is required");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Tour tour =
                tourRepository
                        .findById(req.getTourId())
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        Booking booking = new Booking();
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setTour(tour);
        booking.setContactName(req.getContactName().trim());
        booking.setContactPhone(req.getContactPhone().trim());
        booking.setContactEmail(req.getContactEmail().trim());
        booking.setAdultCount(adult);
        booking.setChildCount(child);
        BigDecimal unitPrice = tour.getBasePrice() == null ? BigDecimal.ZERO : tour.getBasePrice();
        booking.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(passengers)));
        booking.setBookingStatus(BookingStatus.pending);
        booking.setPaymentStatus(BookingPaymentStatus.unpaid);
        booking.setNote(req.getNote());

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse cancelMyBooking(Long userId, Long bookingId) {
        Booking booking =
                bookingRepository
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
        bookingRepository.save(booking);
        return BookingResponse.from(booking);
    }

    private String generateBookingCode() {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate = "BK" + prefix + ThreadLocalRandom.current().nextInt(100, 1000);
            if (bookingRepository.findByBookingCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate booking code");
    }
}
