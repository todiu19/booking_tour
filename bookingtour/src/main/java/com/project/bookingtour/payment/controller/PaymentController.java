package com.project.bookingtour.payment.controller;
// controller để xử lý các yêu cầu liên quan đến thanh toán
import com.project.bookingtour.common.dto.ApiResponse;
import com.project.bookingtour.common.dto.request.PaymentCreateRequest;
import com.project.bookingtour.common.dto.response.PaymentCheckoutResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import com.project.bookingtour.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    // endpoint để tạo yêu cầu thanh toán, được gọi khi khách hàng muốn thanh toán lại cho một booking(hiện tại chưa dùng) 
    // hiện tại luồng là: ấn đặt -> tạo booking - > booking goi tạo payment ....

    @PostMapping
    public ApiResponse<PaymentCheckoutResponse> pay(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestBody PaymentCreateRequest request,
            HttpServletRequest httpRequest) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        ApiResponse<PaymentCheckoutResponse> res = new ApiResponse<>();
        String ip = extractClientIp(httpRequest);
        res.setData(paymentService.payBooking(principal.getId(), request, ip));
        res.setMessage("Payment request created");
        return res;
    }

    // endpoint để nhận IPN từ Vnpay, được Vnpay gọi khi có sự kiện thanh toán xảy ra
    @GetMapping("/vnpay/ipn")
    public Map<String, String> vnpayIpn(@RequestParam Map<String, String> params) {
        return paymentService.handleVnpayIpn(params);
    }

    // endpoint để xử lý return từ Vnpay, được gọi khi khách hàng hoàn thành thanh toán và Vnpay redirect về
    @PostMapping("/vnpay/return")
    public ApiResponse<Map<String, String>> vnpayReturn(@RequestBody Map<String, String> params) {
        ApiResponse<Map<String, String>> res = new ApiResponse<>();
        res.setData(paymentService.handleVnpayIpn(params));
        res.setMessage("VNPay return processed");
        return res;
    }

    // phương thức tiện ích để trích xuất địa chỉ IP của khách hàng từ request, ưu tiên header X-Forwarded-For nếu có, nếu không thì lấy từ remote address
    private static String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        return ip == null || ip.isBlank() ? "127.0.0.1" : ip;
    }
}
