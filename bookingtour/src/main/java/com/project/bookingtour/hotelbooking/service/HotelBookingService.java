package com.project.bookingtour.hotelbooking.service;

import com.project.bookingtour.common.dto.request.HotelBookingCreateRequest;
import com.project.bookingtour.common.dto.response.HotelBookingResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.HotelStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.entity.Payment;
import com.project.bookingtour.domain.entity.User;
import com.project.bookingtour.domain.repository.HotelBookingRepository;
import com.project.bookingtour.domain.repository.HotelRepository;
import com.project.bookingtour.domain.repository.HotelReviewRepository;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import com.project.bookingtour.domain.repository.UserRepository;
import com.project.bookingtour.payment.service.PaymentService;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;
import java.math.RoundingMode;
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
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

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
        Map<Long, Invoice> invoiceMap =
                ids.isEmpty()
                        ? Map.of()
                        : invoiceRepository.findByHotelBooking_IdIn(ids).stream()
                                .filter(inv -> inv.getHotelBooking() != null && inv.getHotelBooking().getId() != null)
                                .collect(java.util.stream.Collectors.toMap(inv -> inv.getHotelBooking().getId(), inv -> inv));
        java.util.Set<Long> finalReviewed = reviewedIds;
        Page<HotelBookingResponse> mapped =
                raw.map(
                        b -> {
                            Invoice inv = invoiceMap.get(b.getId());
                            return HotelBookingResponse.from(
                                    b,
                                    finalReviewed.contains(b.getId()),
                                    inv != null ? inv.getId() : null,
                                    inv != null);
                        });
        return PageResponse.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public HotelBookingResponse getMyBooking(Long userId, Long bookingId) {
        HotelBooking booking =
                hotelBookingRepository
                        .findByIdAndUser_Id(bookingId, userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        Invoice inv = invoiceRepository.findByHotelBooking_Id(booking.getId()).orElse(null);
        return HotelBookingResponse.from(
                booking,
                hotelReviewRepository.existsByHotelBooking_Id(booking.getId()),
                inv != null ? inv.getId() : null,
                inv != null);
    }

    @Transactional
    public HotelBookingResponse createBooking(Long userId, HotelBookingCreateRequest req, String ipAddress) {
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
        if (hotel.getStatus() != HotelStatus.active) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Hotel is not available");
        }

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
        PaymentProvider paymentMethod = req.getPaymentMethod() == null ? PaymentProvider.cod : req.getPaymentMethod();
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
        booking.setPaymentMethod(paymentMethod);
        booking.setBookingStatus(BookingStatus.pending);
        booking.setPaymentStatus(BookingPaymentStatus.unpaid);
        booking.setNote(req.getNote());

        HotelBooking saved = hotelBookingRepository.save(booking);
        if (paymentMethod == PaymentProvider.vnpay) {
            PaymentCheckoutResponse checkout = paymentService.payHotelBooking(userId, saved.getId(), ipAddress);
            HotelBookingResponse response = HotelBookingResponse.from(saved, false, null, false);
            response.setPaymentUrl(checkout.getPaymentUrl());
            return response;
        }
        createHotelPaymentIfAbsent(saved);
        return HotelBookingResponse.from(saved, false, null, false);
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
        paymentRepository
                .findByHotelBooking_Id(booking.getId())
                .ifPresent(
                        payment -> {
                            if (payment.getPaymentStatus() == PaymentStatus.pending) {
                                payment.setPaymentStatus(PaymentStatus.failed);
                                payment.setRawResponse("{\"cancelled\":true,\"source\":\"hotel_booking_cancel\"}");
                                paymentRepository.save(payment);
                            }
                        });
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

    private Payment createHotelPaymentIfAbsent(HotelBooking booking) {
        var existing = paymentRepository.findByHotelBooking_Id(booking.getId());
        if (existing.isPresent()) {
            return existing.get();
        }
        Payment payment = new Payment();
        payment.setBooking(null);
        payment.setHotelBooking(booking);
        payment.setProvider(booking.getPaymentMethod());
        payment.setTransactionRef(generatePaymentRef(booking.getPaymentMethod()));
        payment.setAmount(booking.getTotalAmount() == null ? BigDecimal.ZERO : booking.getTotalAmount());
        payment.setPaymentStatus(
                booking.getPaymentStatus() == BookingPaymentStatus.paid
                        ? PaymentStatus.success
                        : PaymentStatus.pending);
        if (booking.getPaymentStatus() == BookingPaymentStatus.paid) {
            payment.setPaidAt(LocalDateTime.now());
        }
        return paymentRepository.save(payment);
    }

    // private Invoice createHotelInvoiceIfAbsent(HotelBooking booking, Payment payment) {
    //     var existing = invoiceRepository.findByHotelBooking_Id(booking.getId());
    //     if (existing.isPresent()) {
    //         return existing.get();
    //     }
    //     BigDecimal subtotal = booking.getTotalAmount() == null ? BigDecimal.ZERO : booking.getTotalAmount();
    //     BigDecimal tax = subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
    //     BigDecimal total = subtotal.add(tax);
    //     Invoice inv = new Invoice();
    //     inv.setInvoiceNo(generateInvoiceNo());
    //     inv.setBooking(null);
    //     inv.setHotelBooking(booking);
    //     inv.setUser(booking.getUser());
    //     inv.setPayment(payment);
    //     inv.setIssuedAt(LocalDateTime.now());
    //     inv.setSubtotalAmount(subtotal);
    //     inv.setTaxAmount(tax);
    //     inv.setTotalAmount(total);
    //     inv.setBillingName(booking.getContactName());
    //     inv.setBillingPhone(booking.getContactPhone());
    //     inv.setBillingEmail(booking.getContactEmail());
    //     inv.setBillingAddress(null);
    //     inv.setNote("Auto-generated after hotel booking payment success");
    //     return invoiceRepository.save(inv);
    // }

    private String generatePaymentRef(PaymentProvider provider) {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate =
                    provider.name().toUpperCase()
                            + "-H-"
                            + prefix
                            + "-"
                            + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (paymentRepository.findByTransactionRef(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate hotel payment reference");
    }

    private String generateInvoiceNo() {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate = "INVH" + prefix + ThreadLocalRandom.current().nextInt(100, 1000);
            if (invoiceRepository.findByInvoiceNo(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate hotel invoice number");
    }
}
