# Frontend — Booking Tour

Giao diện web React cho hệ thống đặt tour & khách sạn.

> Tài liệu đầy đủ về dự án: xem [README.md](../README.md) ở thư mục gốc.

## Công nghệ

- React 19 + Vite 8
- React Router 7
- Recharts (biểu đồ dashboard admin)

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở **http://localhost:5173**. Backend phải chạy tại `http://localhost:8080`.

## Cấu trúc chính

```
src/
├── api.js              # REST client (cookie-based auth)
├── App.jsx             # Routing
├── pages/              # Trang người dùng & admin
└── components/         # TourCard, AdminShell, Pagination, ...
```

## Trang quản trị

| Route | Mô tả |
|-------|-------|
| `/admin/dashboard` | Thống kê doanh thu |
| `/admin/tours` | Quản lý tour & lịch trình |
| `/admin/hotels` | Quản lý khách sạn |
| `/admin/destinations` | Quản lý địa điểm |
| `/admin/users` | Quản lý người dùng |
| `/admin/cod-confirm` | Xác nhận thu COD |

## Scripts

```bash
npm run dev      # Chạy dev server
npm run build    # Build production
npm run preview  # Xem bản build
npm run lint     # ESLint
```

## Cấu hình API

Sửa `API_BASE_URL` trong `src/api.js` nếu backend không chạy ở `http://localhost:8080`.
