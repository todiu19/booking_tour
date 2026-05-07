package com.project.bookingtour.admin.service;

import com.project.bookingtour.common.dto.request.DestinationCreateRequest;
import com.project.bookingtour.common.dto.request.DestinationUpdateRequest;
import com.project.bookingtour.common.dto.request.HotelCreateRequest;
import com.project.bookingtour.common.dto.request.HotelUpdateRequest;
import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.request.UserCreateRequest;
import com.project.bookingtour.common.dto.request.UserUpdateRequest;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.AdminPaymentItemResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.dto.response.PaymentResponse;
import com.project.bookingtour.common.dto.response.HotelResponse;
import com.project.bookingtour.common.dto.response.HotelBookingResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.dto.response.UserResponse;
import com.project.bookingtour.common.enums.HotelStatus;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.destination.service.DestinationService;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.HotelBooking;
import com.project.bookingtour.domain.entity.HotelImage;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.entity.Payment;
import com.project.bookingtour.domain.repository.DestinationRepository;
import com.project.bookingtour.domain.repository.HotelRepository;
import com.project.bookingtour.domain.repository.HotelBookingRepository;
import com.project.bookingtour.domain.repository.HotelImageRepository;
import com.project.bookingtour.domain.repository.HotelTypeRepository;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import com.project.bookingtour.payment.service.PaymentService;
import com.project.bookingtour.tour.service.TourService;
import com.project.bookingtour.user.service.UserService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TourService tourService;
    private final DestinationService destinationService;
    private final UserService userService;
    private final PaymentService paymentService;
    private final HotelRepository hotelRepository;
    private final DestinationRepository destinationRepository;
    private final HotelTypeRepository hotelTypeRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final HotelImageRepository hotelImageRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

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

    public void unblockUser(Long id) {
        userService.unblockUser(id);
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

    public void publishTour(Long id) {
        tourService.publishTour(id);
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

    public PageResponse<HotelResponse> listHotels(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<HotelResponse> mapped =
                hotelRepository
                        .findAll(PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id")))
                        .map(HotelResponse::from);
        return PageResponse.fromPage(mapped);
    }

    public HotelResponse createHotel(HotelCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "name is required");
        }
        Hotel hotel = new Hotel();
        applyHotelFields(hotel, request);
        Hotel saved = hotelRepository.save(hotel);
        appendHotelImageUrls(saved, request.getImageUrls());
        return HotelResponse.from(saved);
    }

    public HotelResponse updateHotel(Long id, HotelUpdateRequest request) {
        Hotel hotel =
                hotelRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel not found"));
        applyHotelFields(hotel, request);
        Hotel saved = hotelRepository.save(hotel);
        appendHotelImageUrls(saved, request.getImageUrls());
        return HotelResponse.from(saved);
    }

    public void blockHotel(Long id) {
        Hotel hotel =
                hotelRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel not found"));
        hotel.setStatus(HotelStatus.blocked);
        hotelRepository.save(hotel);
    }

    public void unblockHotel(Long id) {
        Hotel hotel =
                hotelRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel not found"));
        hotel.setStatus(HotelStatus.active);
        hotelRepository.save(hotel);
    }

    private void applyHotelFields(Hotel hotel, HotelCreateRequest request) {
        hotel.setName(request.getName().trim());
        hotel.setAddress(request.getAddress());
        hotel.setLocation(request.getLocation());
        hotel.setDescription(request.getDescription());
        hotel.setBasePrice(request.getBasePrice());
        hotel.setRoomCapacity(request.getRoomCapacity());
        hotel.setStatus(request.getStatus() == null ? HotelStatus.active : request.getStatus());
        hotel.setDestination(
                request.getDestinationId() == null
                        ? null
                        : destinationRepository
                                .findById(request.getDestinationId())
                                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Destination not found")));
        hotel.setHotelType(
                request.getHotelTypeId() == null
                        ? null
                        : hotelTypeRepository
                                .findById(request.getHotelTypeId())
                                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel type not found")));
    }

    private void applyHotelFields(Hotel hotel, HotelUpdateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "name is required");
        }
        HotelCreateRequest converted = new HotelCreateRequest();
        converted.setName(request.getName());
        converted.setAddress(request.getAddress());
        converted.setLocation(request.getLocation());
        converted.setDescription(request.getDescription());
        converted.setBasePrice(request.getBasePrice());
        converted.setRoomCapacity(request.getRoomCapacity());
        converted.setDestinationId(request.getDestinationId());
        converted.setHotelTypeId(request.getHotelTypeId());
        converted.setImageUrls(request.getImageUrls());
        converted.setStatus(request.getStatus());
        applyHotelFields(hotel, converted);
    }

    private void appendHotelImageUrls(Hotel hotel, List<String> imageUrls) {
        if (hotel == null || imageUrls == null || imageUrls.isEmpty()) {
            return;
        }
        int nextDisplayOrder =
                hotel.getImages() == null || hotel.getImages().isEmpty()
                        ? 1
                        : hotel.getImages().stream()
                                .map(HotelImage::getDisplayOrder)
                                .filter(java.util.Objects::nonNull)
                                .max(Integer::compareTo)
                                .orElse(0)
                                + 1;
        for (String raw : imageUrls) {
            String url = raw == null ? "" : raw.trim();
            if (url.isEmpty()) {
                continue;
            }
            HotelImage image = new HotelImage();
            image.setHotel(hotel);
            image.setImageUrl(url);
            image.setDisplayOrder(nextDisplayOrder++);
            hotelImageRepository.save(image);
        }
    }

    public List<HotelBookingResponse> listPendingCodHotelBookings() {
        List<HotelBooking> bookings =
                hotelBookingRepository
                .findByPaymentMethodAndPaymentStatusOrderByCreatedAtDesc(
                        PaymentProvider.cod, BookingPaymentStatus.unpaid);
        List<Long> ids = bookings.stream().map(HotelBooking::getId).toList();
        Map<Long, Invoice> invoiceMap =
                ids.isEmpty()
                        ? Map.of()
                        : invoiceRepository.findByHotelBooking_IdIn(ids).stream()
                                .filter(inv -> inv.getHotelBooking() != null && inv.getHotelBooking().getId() != null)
                                .collect(java.util.stream.Collectors.toMap(inv -> inv.getHotelBooking().getId(), inv -> inv));
        return bookings.stream()
                .map(
                        b -> {
                            Invoice inv = invoiceMap.get(b.getId());
                            return HotelBookingResponse.from(
                                    b, false, inv != null ? inv.getId() : null, inv != null);
                        })
                .toList();
    }

    public HotelBookingResponse confirmHotelCodCollected(Long hotelBookingId) {
        HotelBooking booking =
                hotelBookingRepository
                        .findById(hotelBookingId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getPaymentMethod() != PaymentProvider.cod) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Only COD hotel bookings can be confirmed");
        }
        if (booking.getBookingStatus() == BookingStatus.cancelled) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CANCEL, "Cancelled hotel booking cannot confirm COD");
        }
        if (booking.getPaymentStatus() == BookingPaymentStatus.paid) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Hotel booking already paid");
        }
        booking.setPaymentStatus(BookingPaymentStatus.paid);
        if (booking.getBookingStatus() == BookingStatus.pending) {
            booking.setBookingStatus(BookingStatus.confirmed);
        }
        HotelBooking saved = hotelBookingRepository.save(booking);
        Payment payment = paymentRepository.findByHotelBooking_Id(saved.getId()).orElseGet(() -> {
            Payment created = new Payment();
            created.setBooking(null);
            created.setHotelBooking(saved);
            created.setProvider(PaymentProvider.cod);
            created.setTransactionRef("COD-H-" + saved.getBookingCode());
            created.setAmount(saved.getTotalAmount());
            created.setPaymentStatus(PaymentStatus.pending);
            return paymentRepository.save(created);
        });
        payment.setPaymentStatus(PaymentStatus.success);
        payment.setPaidAt(java.time.LocalDateTime.now());
        payment = paymentRepository.save(payment);
        Invoice invoice = createHotelInvoiceIfAbsent(saved, payment);
        return HotelBookingResponse.from(saved, false, invoice.getId(), true);
    }

    private Invoice createHotelInvoiceIfAbsent(HotelBooking booking, Payment payment) {
        var existing = invoiceRepository.findByHotelBooking_Id(booking.getId());
        if (existing.isPresent()) {
            return existing.get();
        }
        java.math.BigDecimal subtotal = booking.getTotalAmount() == null ? java.math.BigDecimal.ZERO : booking.getTotalAmount();
        java.math.BigDecimal tax =
                subtotal.multiply(new java.math.BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal total = subtotal.add(tax);
        Invoice inv = new Invoice();
        inv.setInvoiceNo(generateInvoiceNo());
        inv.setBooking(null);
        inv.setHotelBooking(booking);
        inv.setUser(booking.getUser());
        inv.setPayment(payment);
        inv.setIssuedAt(java.time.LocalDateTime.now());
        inv.setSubtotalAmount(subtotal);
        inv.setTaxAmount(tax);
        inv.setTotalAmount(total);
        inv.setBillingName(booking.getContactName());
        inv.setBillingPhone(booking.getContactPhone());
        inv.setBillingEmail(booking.getContactEmail());
        inv.setBillingAddress(null);
        inv.setNote("Auto-generated after admin confirmed hotel COD");
        return invoiceRepository.save(inv);
    }

    private String generateInvoiceNo() {
        String prefix =
                java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                        .format(java.time.LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate = "INVH" + prefix + java.util.concurrent.ThreadLocalRandom.current().nextInt(100, 1000);
            if (invoiceRepository.findByInvoiceNo(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate hotel invoice number");
    }

}
