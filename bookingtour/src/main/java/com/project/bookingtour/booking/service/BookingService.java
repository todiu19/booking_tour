package com.project.bookingtour.booking.service;

import com.project.bookingtour.common.dto.request.BookingCreateRequest;
import com.project.bookingtour.common.dto.request.PaymentCreateRequest;
import com.project.bookingtour.common.dto.response.BookingCheckoutResponse;
import com.project.bookingtour.common.dto.response.BookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.entity.Payment;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourDeparture;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import com.project.bookingtour.domain.repository.ReviewRepository;
import com.project.bookingtour.domain.repository.TourDepartureRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import com.project.bookingtour.payment.service.PaymentService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final TourDepartureRepository tourDepartureRepository;
    private final ReviewRepository reviewRepository;

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

        List<Long> tourIds =
                result.getContent().stream()
                        .map(b -> b.getTour() != null ? b.getTour().getId() : null)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .toList();
        Map<Long, List<LocalDate>> departuresByTour = loadDeparturesByTour(tourIds);
        Set<Long> reviewedTourIds = loadReviewedTourIds(userId, tourIds);

        Page<BookingResponse> mapped =
                result.map(
                        b -> {
                            BookingResponse r = BookingResponse.from(b);
                            Invoice inv = invoiceByBookingId.get(b.getId());
                            if (inv != null) {
                                r.setInvoiceId(inv.getId());
                            }
                            r.setCanViewInvoice(b.getPaymentStatus() == BookingPaymentStatus.paid);
                            Long tourId = b.getTour() != null ? b.getTour().getId() : null;
                            r.setDepartureDate(
                                    pickEffectiveDepartureDate(
                                            departuresByTour.get(tourId),
                                            b.getCreatedAt() != null
                                                    ? b.getCreatedAt().toLocalDate()
                                                    : null));
                            r.setReviewed(tourId != null && reviewedTourIds.contains(tourId));
                            return r;
                        });
        return PageResponse.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBooking(Long userId, Long bookingId) {
        Booking booking =
                bookingRepository
                        .findByIdAndUser_Id(bookingId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        BookingResponse response = BookingResponse.from(booking);
        invoiceRepository.findByBooking_Id(booking.getId()).ifPresent(inv -> response.setInvoiceId(inv.getId()));
        response.setCanViewInvoice(booking.getPaymentStatus() == BookingPaymentStatus.paid);
        Long tourId = booking.getTour() != null ? booking.getTour().getId() : null;
        if (tourId != null) {
            List<LocalDate> dates =
                    tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId).stream()
                            .map(TourDeparture::getDepartureDate)
                            .toList();
            response.setDepartureDate(
                    pickEffectiveDepartureDate(
                            dates,
                            booking.getCreatedAt() != null
                                    ? booking.getCreatedAt().toLocalDate()
                                    : null));
            response.setReviewed(reviewRepository.existsByUser_IdAndTour_Id(userId, tourId));
        }
        return response;
    }

    private Map<Long, List<LocalDate>> loadDeparturesByTour(List<Long> tourIds) {
        if (tourIds.isEmpty()) {
            return Map.of();
        }
        return tourDepartureRepository.findByTour_IdInOrderByDepartureDateAsc(tourIds).stream()
                .filter(td -> td.getTour() != null && td.getDepartureDate() != null)
                .collect(
                        Collectors.groupingBy(
                                td -> td.getTour().getId(),
                                Collectors.mapping(TourDeparture::getDepartureDate, Collectors.toList())));
    }

    private Set<Long> loadReviewedTourIds(Long userId, List<Long> tourIds) {
        if (tourIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(reviewRepository.findReviewedTourIdsByUser(userId, tourIds));
    }

    /**
     * Heuristic chọn ngày khởi hành đại diện cho booking khi schema chưa lưu rõ user đặt chuyến nào:
     * lấy ngày khởi hành sớm nhất >= ngày tạo booking. Nếu không có (booking đặt sau khi mọi chuyến
     * đã xảy ra), trả về ngày khởi hành mới nhất. Trả về null nếu tour chưa có lịch.
     */
    private LocalDate pickEffectiveDepartureDate(List<LocalDate> sortedAscDates, LocalDate bookedOn) {
        if (sortedAscDates == null || sortedAscDates.isEmpty()) {
            return null;
        }
        if (bookedOn != null) {
            for (LocalDate d : sortedAscDates) {
                if (!d.isBefore(bookedOn)) {
                    return d;
                }
            }
        }
        return sortedAscDates.get(sortedAscDates.size() - 1);
    }

    @Transactional
    public BookingCheckoutResponse createBooking(Long userId, BookingCreateRequest req, String ipAddress) {
        if (req.getTourId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "tourId is required");
        }
        if (req.getPaymentMethod() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "paymentMethod is required");
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
        Tour tour =
                tourRepository
                        .findById(req.getTourId())
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        Booking booking = new Booking();
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setTour(tour);
        booking.setContactName(contactName);
        booking.setContactPhone(contactPhone);
        booking.setContactEmail(contactEmail);
        booking.setAdultCount(adult);
        booking.setChildCount(child);
        BigDecimal unitPrice = tour.getBasePrice() == null ? BigDecimal.ZERO : tour.getBasePrice();
        booking.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(passengers)));
        booking.setBookingStatus(BookingStatus.pending);
        booking.setPaymentStatus(BookingPaymentStatus.unpaid);
        booking.setNote(req.getNote());

        Booking saved = bookingRepository.save(booking);
        PaymentCreateRequest paymentReq = new PaymentCreateRequest();
        paymentReq.setBookingId(saved.getId());
        paymentReq.setProvider(req.getPaymentMethod());
        PaymentCheckoutResponse checkout = paymentService.payBooking(userId, paymentReq, ipAddress);

        BookingCheckoutResponse result = new BookingCheckoutResponse();
        result.setBooking(BookingResponse.from(saved));
        result.setPayment(checkout.getPayment());
        result.setInvoice(checkout.getInvoice());
        result.setPaymentUrl(checkout.getPaymentUrl());
        return result;
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
        List<Payment> payments = paymentRepository.findByBooking_Id(booking.getId());
        for (Payment payment : payments) {
            if (payment.getPaymentStatus() == PaymentStatus.pending) {
                payment.setPaymentStatus(PaymentStatus.failed);
                payment.setRawResponse("{\"cancelled\":true,\"source\":\"booking_cancel\"}");
                paymentRepository.save(payment);
            }
        }
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
