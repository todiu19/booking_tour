# Booking Tour — Hệ thống đặt tour & khách sạn

Dự án môn **Thực tập chuyên ngành (TTCS)** — Nhóm 03.  
Ứng dụng web full-stack cho phép khách hàng tìm kiếm, đặt tour/khách sạn và thanh toán; admin quản lý tour, khách sạn, địa điểm, người dùng và xác nhận thanh toán COD.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Frontend | React 19, Vite 8, React Router |
| Cơ sở dữ liệu | MySQL |
| Xác thực | JWT (lưu trong HTTP-only cookie) |
| Thanh toán | VNPay Sandbox, COD (thu tiền mặt) |
| Build tool | Maven (backend), npm (frontend) |

## Tính năng chính

### Khách hàng
- Xem trang chủ, danh sách tour, khách sạn, địa điểm nổi tiếng
- Tìm kiếm & lọc tour (giá, số ngày, điểm đến, điểm khởi hành)
- Xem chi tiết tour (lịch trình từng ngày, ngày khởi hành, đánh giá)
- Đăng ký, đăng nhập, cập nhật hồ sơ, đổi mật khẩu
- Đặt tour / đặt phòng khách sạn
- Thanh toán qua VNPay hoặc COD
- Xem đơn đặt, hóa đơn, viết đánh giá

### Quản trị viên
- Dashboard thống kê doanh thu
- Quản lý người dùng (tạo, khóa/mở khóa)
- Quản lý tour (tạo, sửa, xuất bản, lưu trữ, upload ảnh, **lịch trình theo ngày**)
- Quản lý khách sạn & địa điểm
- Xác nhận thu tiền COD (tour & khách sạn)

## Cấu trúc thư mục

```
TTCS/
├── bookingtour/          # Backend Spring Boot
│   └── src/main/java/com/project/bookingtour/
│       ├── admin/          # API quản trị
│       ├── auth/           # Đăng ký / đăng nhập
│       ├── booking/        # Đặt tour
│       ├── destination/    # Địa điểm
│       ├── hotel/          # Khách sạn
│       ├── hotelbooking/   # Đặt phòng
│       ├── payment/        # Thanh toán VNPay, COD
│       ├── tour/           # Tour công khai
│       ├── security/       # JWT, SecurityConfig
│       └── domain/         # Entity & Repository
├── FE/                   # Frontend React + Vite
│   └── src/
│       ├── pages/          # Các trang (Home, Tours, Admin, ...)
│       ├── components/     # Component dùng chung
│       └── api.js          # Client gọi REST API
└── README.md
```

## Yêu cầu hệ thống

- **JDK 21**
- **Maven 3.9+** (hoặc dùng `./mvnw` trong thư mục `bookingtour`)
- **Node.js 18+** và **npm**
- **MySQL 8+**

## Hướng dẫn cài đặt

### 1. Cơ sở dữ liệu

Tạo database MySQL:

```sql
CREATE DATABASE booking_tour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Cấu hình kết nối trong `bookingtour/src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/booking_tour?useUnicode=true&characterEncoding=UTF-8
    username: root
    password: <mat-khau-cua-ban>
```

> Hibernate tự tạo/cập nhật bảng (`ddl-auto: update`). File `data.sql` chứa dữ liệu mẫu (có thể bật/tắt bằng cách comment/uncomment).

### 2. Cấu hình JWT & VNPay

Trong `application.yaml`, cập nhật các giá trị sau trước khi chạy production:

```yaml
app:
  jwt:
    secret: "<chuoi-bi-mat-ngau-nhien-it-nhat-32-ky-tu>"
  vnpay:
    tmn-code: "<ma-TMN-VNPay-sandbox>"
    hash-secret: "<hash-secret-VNPay>"
    return-url: "http://localhost:5173/payment/vnpay-return"
    ipn-url: "http://localhost:8080/payments/vnpay/ipn"
```

### 3. Chạy Backend

```bash
cd bookingtour
./mvnw spring-boot:run
```

API chạy tại: **http://localhost:8080**

### 4. Chạy Frontend

```bash
cd FE
npm install
npm run dev
```

Giao diện chạy tại: **http://localhost:5173**

Frontend mặc định gọi API qua `http://localhost:8080` (xem `FE/src/api.js`).

## Tài khoản mẫu

Trong `data.sql` (khi được bật) có tài khoản demo:

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin1@gmail.com | Admin@123 |
| Khách hàng | customer1@gmail.com | User@123 |
| Khách hàng | customer2@gmail.com | User@123 |

## Luồng tạo tour & lịch trình (Itinerary)

Khi admin tạo tour qua `POST /admin/tour`, request body có thể kèm mảng `itineraries`. Mỗi phần tử mô tả **một ngày** trong chương trình tour:

```json
{
  "code": "HN-DN-5D",
  "name": "Hà Nội - Đà Nẵng 5 ngày 4 đêm",
  "durationDays": 5,
  "basePrice": 5990000,
  "departurePoint": "Ha Noi",
  "departureDates": ["2026-09-01", "2026-09-15"],
  "destinationIds": [1, 6],
  "imageUrls": ["/images/tours/abc.png"],
  "itineraries": [
    {
      "dayNumber": 1,
      "title": "Khởi hành Hà Nội",
      "description": "Tập trung, di chuyển ra sân bay...",
      "hotels": [{ "hotelId": 3, "nightCount": 1 }]
    },
    {
      "dayNumber": 2,
      "title": "Tham quan Đà Nẵng",
      "description": "Ngũ Hành Sơn, biển Mỹ Khê..."
    }
  ]
}
```

**Xử lý phía backend** (`TourService.syncItineraries`):

1. Xóa toàn bộ lịch trình cũ của tour (nếu đang cập nhật)
2. Sắp xếp theo `dayNumber` tăng dần
3. Validate: `dayNumber` và `title` bắt buộc
4. Lưu từng `TourItinerary`; nếu có `hotels`, liên kết khách sạn nghỉ qua đêm (`nightCount`)

**Xử lý phía frontend** (`AdminToursPage.jsx`):

- Form cho phép thêm/xóa từng ngày lịch trình
- Hàm `itinerariesToPayload()` chuẩn hóa dữ liệu trước khi gửi API
- Chỉ gửi các mục hợp lệ (`dayNumber >= 1` và có `title`)

## API chính

| Nhóm | Endpoint | Mô tả |
|------|----------|-------|
| Công khai | `GET /home` | Dữ liệu trang chủ |
| Công khai | `GET /tours`, `GET /tours/{id}` | Danh sách & chi tiết tour |
| Công khai | `GET /hotels`, `GET /destinations` | Khách sạn & địa điểm |
| Auth | `POST /auth/register`, `POST /auth/login` | Đăng ký / đăng nhập |
| Người dùng | `GET /me`, `PUT /update` | Hồ sơ cá nhân |
| Booking | `POST /bookings`, `GET /bookings/me` | Đặt & xem tour |
| Payment | `POST /payments` | Tạo thanh toán (VNPay/COD) |
| Admin | `GET/POST/PUT /admin/tour*` | CRUD tour |
| Admin | `GET/POST/PUT /admin/hotel*` | CRUD khách sạn |
| Admin | `GET /dashboard` | Thống kê |

Phân quyền: endpoint `/admin/**` và `/dashboard` yêu cầu role **admin**; các endpoint đặt tour, thanh toán yêu cầu đăng nhập.

## Scripts hữu ích

```bash
# Backend — build JAR
cd bookingtour && ./mvnw clean package -DskipTests

# Frontend — build production
cd FE && npm run build

# Frontend — lint
cd FE && npm run lint
```

## Nhóm phát triển

**Nhóm 03** — Môn Thực tập chuyên ngành (TTCS)

## Ghi chú

- Không commit mật khẩu database, JWT secret hoặc VNPay credentials lên Git.
- VNPay sandbox chỉ dùng cho môi trường phát triển.
- Ảnh upload được lưu tại `bookingtour/src/main/resources/static/images/`.
