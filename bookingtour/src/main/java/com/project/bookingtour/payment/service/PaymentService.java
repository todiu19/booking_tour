package com.project.bookingtour.payment.service;

import com.project.bookingtour.config.VnpayProperties;
import com.project.bookingtour.common.dto.request.PaymentCreateRequest;
import com.project.bookingtour.common.dto.response.AdminPaymentItemResponse;
import com.project.bookingtour.common.dto.response.InvoiceResponse;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.dto.response.PaymentResponse;
import com.project.bookingtour.common.enums.BookingPaymentStatus;
import com.project.bookingtour.common.enums.BookingStatus;
import com.project.bookingtour.common.enums.PaymentProvider;
import com.project.bookingtour.common.enums.PaymentStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Booking;
import com.project.bookingtour.domain.entity.Invoice;
import com.project.bookingtour.domain.entity.Payment;
import com.project.bookingtour.domain.repository.BookingRepository;
import com.project.bookingtour.domain.repository.InvoiceRepository;
import com.project.bookingtour.domain.repository.PaymentRepository;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("0.10");
    private static final DateTimeFormatter VNPAY_TIME_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String VNPAY_VERSION = "2.1.0";
    private static final String VNPAY_COMMAND = "pay";
    private static final String VNPAY_ORDER_TYPE = "other";

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final VnpayProperties vnpayProperties;

    @Transactional
    public PaymentCheckoutResponse payBooking(Long userId, PaymentCreateRequest req, String ipAddress) {
        if (req.getBookingId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "bookingId is required");
        }
        if (req.getProvider() == null) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_REQUIRED);
        }

        Booking booking =
                bookingRepository
                        .findByIdAndUser_Id(req.getBookingId(), userId)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getBookingStatus() == BookingStatus.cancelled) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CANCEL, "Cancelled booking cannot be paid");
        }
        if (booking.getPaymentStatus() == BookingPaymentStatus.paid) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_PAID);
        }

        if (req.getProvider() == PaymentProvider.cod) {
            return createCodPendingPayment(booking);
        }
        if (req.getProvider() == PaymentProvider.vnpay) {
            return createVnpayPayment(booking, ipAddress);
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider(req.getProvider());
        payment.setTransactionRef(generateTransactionRef(req.getProvider().name()));
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.success);
        payment.setPaidAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        booking.setPaymentStatus(BookingPaymentStatus.paid);
        if (booking.getBookingStatus() == BookingStatus.pending) {
            booking.setBookingStatus(BookingStatus.confirmed);
        }
        bookingRepository.save(booking);

        Invoice invoice = createInvoiceIfAbsent(booking, savedPayment);
        PaymentCheckoutResponse res = new PaymentCheckoutResponse();
        res.setPayment(PaymentResponse.from(savedPayment));
        res.setInvoice(InvoiceResponse.from(invoice));
        return res;
    }

    private PaymentCheckoutResponse createCodPendingPayment(Booking booking) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider(PaymentProvider.cod);
        payment.setTransactionRef(generateTransactionRef(PaymentProvider.cod.name()));
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.pending);
        payment.setRawResponse("{\"mode\":\"cod\"}");
        Payment saved = paymentRepository.save(payment);

        // COD: chưa thu tiền thật nên giữ booking ở unpaid, chưa tạo hóa đơn.
        PaymentCheckoutResponse res = new PaymentCheckoutResponse();
        res.setPayment(PaymentResponse.from(saved));
        return res;
    }

    @Transactional
    public Map<String, String> handleVnpayIpn(Map<String, String> allParams) {
        String secureHash = allParams.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return ipnResult("97", "Missing signature");
        }
        Map<String, String> paramsToSign =
                allParams.entrySet().stream()
                        .filter(
                                e ->
                                        e.getKey() != null
                                                && !e.getKey().isBlank()
                                                && e.getValue() != null
                                                && !e.getValue().isBlank()
                                                && !e.getKey().equals("vnp_SecureHash")
                                                && !e.getKey().equals("vnp_SecureHashType"))
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        String expected = hmacSha512(vnpayProperties.hashSecret(), buildHashData(paramsToSign));
        if (!secureHash.equalsIgnoreCase(expected)) {
            return ipnResult("97", "Invalid signature");
        }

        String txnRef = allParams.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            return ipnResult("01", "Transaction not found");
        }
        Payment payment = paymentRepository.findByTransactionRef(txnRef).orElse(null);
        if (payment == null) {
            return ipnResult("01", "Transaction not found");
        }

        long vnpAmount = parseLongSafe(allParams.get("vnp_Amount"));
        long expectedAmount = payment.getAmount().multiply(new BigDecimal("100")).longValue();
        if (vnpAmount != expectedAmount) {
            return ipnResult("04", "Invalid amount");
        }

        if (payment.getPaymentStatus() == PaymentStatus.success) {
            return ipnResult("02", "Order already confirmed");
        }

        payment.setRawResponse(allParams.toString());
        String rspCode = allParams.getOrDefault("vnp_ResponseCode", "");
        String txnStatus = allParams.getOrDefault("vnp_TransactionStatus", "");
        if ("00".equals(rspCode) && "00".equals(txnStatus)) {
            payment.setPaymentStatus(PaymentStatus.success);
            payment.setPaidAt(LocalDateTime.now(VN_ZONE));
            paymentRepository.save(payment);
            markBookingPaidAndCreateInvoice(payment);
            return ipnResult("00", "Confirm Success");
        }

        payment.setPaymentStatus(PaymentStatus.failed);
        paymentRepository.save(payment);
        return ipnResult("00", "Confirm Success");
    }

    @Transactional
    public PaymentCheckoutResponse confirmCodCollected(Long paymentId) {
        Payment payment =
                paymentRepository
                        .findById(paymentId)
                        .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getProvider() != PaymentProvider.cod) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_INVALID, "Only COD payment can be confirmed here");
        }
        if (payment.getPaymentStatus() != PaymentStatus.pending) {
            throw new AppException(ErrorCode.PAYMENT_NOT_PENDING);
        }

        payment.setPaymentStatus(PaymentStatus.success);
        payment.setPaidAt(LocalDateTime.now(VN_ZONE));
        Payment saved = paymentRepository.save(payment);
        Invoice invoice = markBookingPaidAndCreateInvoice(saved);

        PaymentCheckoutResponse res = new PaymentCheckoutResponse();
        res.setPayment(PaymentResponse.from(saved));
        res.setInvoice(InvoiceResponse.from(invoice));
        return res;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPendingCodPayments() {
        return paymentRepository
                .findByProviderAndPaymentStatusOrderByCreatedAtDesc(
                        PaymentProvider.cod, PaymentStatus.pending)
                .stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentItemResponse> listPaymentsForAdmin() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminPaymentItemResponse::from)
                .toList();
    }

    private PaymentCheckoutResponse createVnpayPayment(Booking booking, String ipAddress) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider(PaymentProvider.vnpay);
        payment.setTransactionRef(generateTransactionRef(PaymentProvider.vnpay.name()));
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.pending);
        payment.setRawResponse("{}");
        Payment savedPayment = paymentRepository.save(payment);

        String paymentUrl = buildVnpayPaymentUrl(savedPayment, booking, ipAddress);
        PaymentCheckoutResponse res = new PaymentCheckoutResponse();
        res.setPayment(PaymentResponse.from(savedPayment));
        res.setPaymentUrl(paymentUrl);
        return res;
    }

    private String buildVnpayPaymentUrl(Payment payment, Booking booking, String ipAddress) {
        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        LocalDateTime expire = now.plusMinutes(Math.max(vnpayProperties.expireMinutes(), 1));
        String safeIp = (ipAddress == null || ipAddress.isBlank()) ? "127.0.0.1" : ipAddress;
        long amount = payment.getAmount().multiply(new BigDecimal("100")).longValue();

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", VNPAY_VERSION);
        params.put("vnp_Command", VNPAY_COMMAND);
        params.put("vnp_TmnCode", vnpayProperties.tmnCode());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", vnpayProperties.currCode());
        params.put("vnp_TxnRef", payment.getTransactionRef());
        params.put("vnp_OrderInfo", "Thanh toan booking " + booking.getBookingCode());
        params.put("vnp_OrderType", VNPAY_ORDER_TYPE);
        params.put("vnp_Locale", vnpayProperties.locale());
        params.put("vnp_ReturnUrl", vnpayProperties.returnUrl());
        params.put("vnp_IpAddr", safeIp);
        params.put("vnp_CreateDate", VNPAY_TIME_FMT.format(now));
        params.put("vnp_ExpireDate", VNPAY_TIME_FMT.format(expire));

        String hashData = buildHashData(params);
        String secureHash = hmacSha512(vnpayProperties.hashSecret(), hashData);
        String query = buildQuery(params) + "&vnp_SecureHash=" + urlEncode(secureHash);
        return vnpayProperties.payUrl() + "?" + query;
    }

    private Invoice markBookingPaidAndCreateInvoice(Payment payment) {
        Booking booking = payment.getBooking();
        booking.setPaymentStatus(BookingPaymentStatus.paid);
        if (booking.getBookingStatus() == BookingStatus.pending) {
            booking.setBookingStatus(BookingStatus.confirmed);
        }
        bookingRepository.save(booking);
        return createInvoiceIfAbsent(booking, payment);
    }

    private Invoice createInvoiceIfAbsent(Booking booking, Payment payment) {
        var existing = invoiceRepository.findByBooking_Id(booking.getId());
        if (existing.isPresent()) {
            return existing.get();
        }
        BigDecimal subtotal = booking.getTotalAmount() == null ? BigDecimal.ZERO : booking.getTotalAmount();
        BigDecimal tax = subtotal.multiply(DEFAULT_TAX_RATE).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);

        Invoice inv = new Invoice();
        inv.setInvoiceNo(generateInvoiceNo());
        inv.setBooking(booking);
        inv.setUser(booking.getUser());
        inv.setPayment(payment);
        inv.setIssuedAt(LocalDateTime.now());
        inv.setSubtotalAmount(subtotal);
        inv.setTaxAmount(tax);
        inv.setTotalAmount(total);
        inv.setBillingName(booking.getContactName());
        inv.setBillingPhone(booking.getContactPhone());
        inv.setBillingEmail(booking.getContactEmail());
        inv.setNote("Auto-generated after payment success");
        return invoiceRepository.save(inv);
    }

    private String generateInvoiceNo() {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate = "INV" + prefix + ThreadLocalRandom.current().nextInt(100, 1000);
            if (invoiceRepository.findByInvoiceNo(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate invoice number");
    }

    private String generateTransactionRef(String providerPrefix) {
        String prefix = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        for (int i = 0; i < 20; i++) {
            String candidate =
                    providerPrefix.toUpperCase()
                            + "-"
                            + prefix
                            + "-"
                            + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (paymentRepository.findByTransactionRef(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to generate transaction reference");
    }

    private static String buildHashData(Map<String, String> params) {
        return params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .map(e -> e.getKey() + "=" + urlEncode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    private static String buildQuery(Map<String, String> params) {
        return params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    private static String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Unable to sign VNPay payload", e);
        }
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private static long parseLongSafe(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            return -1;
        }
    }

    private static Map<String, String> ipnResult(String code, String msg) {
        Map<String, String> map = new HashMap<>();
        map.put("RspCode", code);
        map.put("Message", msg);
        return map;
    }
}
