CREATE DATABASE IF NOT EXISTS booking_tour
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE booking_tour;

-- 1) ROLES
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    UNIQUE KEY uq_roles_name (name)
);

-- 2) USERS
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    status ENUM('active','blocked') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),
    KEY idx_users_role_id (role_id),
    CONSTRAINT fk_users_role
      FOREIGN KEY (role_id) REFERENCES roles(id)
      ON DELETE RESTRICT
);
-- Nếu DB cũ còn cột thừa `role` (VARCHAR) trên users: chạy sql/drop_legacy_users_role_column.sql

-- 3) TOURS
CREATE TABLE tours (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INT UNSIGNED NOT NULL DEFAULT 1,
    departure_date DATE NULL,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    destination_list JSON NULL, -- e.g. ["Hoi An"] — các điểm trong hành trình (không nhất thiết trùng điểm xuất phát)
    departure_point VARCHAR(64) NULL, -- điểm xuất phát: Ha Noi, TP. Ho Chi Minh, Da Nang, ...
    status ENUM('published','archived') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tours_code (code)
);

-- 4) TOUR_IMAGES (one-to-many)
-- 4) TOUR_DEPARTURES (one-to-many)
CREATE TABLE tour_departures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tour_id BIGINT UNSIGNED NOT NULL,
    departure_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tour_departures_tour_date (tour_id, departure_date),
    KEY idx_tour_departures_tour_date (tour_id, departure_date),
    CONSTRAINT fk_tour_departures_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE CASCADE
);

-- migrate du lieu cu: 1 tour/1 departure_date thanh danh sach departure
INSERT IGNORE INTO tour_departures (tour_id, departure_date)
SELECT id, departure_date
FROM tours
WHERE departure_date IS NOT NULL;

-- 5) TOUR_IMAGES (one-to-many)
CREATE TABLE tour_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tour_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY uq_tour_images_tour_url (tour_id, image_url),
    CONSTRAINT fk_tour_images_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE CASCADE
);

CREATE INDEX idx_tour_images_tour_order ON tour_images (tour_id, display_order);

-- 6) DESTINATIONS
CREATE TABLE destinations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    province VARCHAR(150),
    country VARCHAR(150) DEFAULT 'Viet Nam',
    image_url VARCHAR(500) NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_destination_name_province_country (name, province, country)
);

-- Nếu DB đã tạo từ schema cũ, chạy thêm:
-- ALTER TABLE destinations ADD COLUMN image_url VARCHAR(500) NULL AFTER country;
-- ALTER TABLE destinations ADD COLUMN description TEXT NULL AFTER image_url;

-- 7) TOUR_DESTINATIONS (many-to-many)
CREATE TABLE tour_destinations (
    tour_id BIGINT UNSIGNED NOT NULL,
    destination_id BIGINT UNSIGNED NOT NULL,
    day_number INT UNSIGNED NULL,
    PRIMARY KEY (tour_id, destination_id),
    CONSTRAINT fk_td_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_td_destination
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
      ON DELETE RESTRICT
);

-- 8) HOTELS
CREATE TABLE hotel_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    UNIQUE KEY uq_hotel_types_code (code)
);

CREATE TABLE hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    description TEXT NULL,
    base_price DECIMAL(12,2) NULL,
    room_capacity INT UNSIGNED NULL,
    status ENUM('active','blocked') NOT NULL DEFAULT 'active',
    destination_id BIGINT UNSIGNED NULL,
    hotel_type_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotel_destination
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
      ON DELETE SET NULL,
    CONSTRAINT fk_hotel_type
      FOREIGN KEY (hotel_type_id) REFERENCES hotel_types(id)
      ON DELETE SET NULL
);

CREATE TABLE hotel_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_hotel_images_hotel
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      ON DELETE CASCADE
);

CREATE INDEX idx_hotel_images_hotel_order ON hotel_images (hotel_id, display_order);

CREATE TABLE hotel_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    reviewer_name VARCHAR(150) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    status ENUM('visible','hidden') NOT NULL DEFAULT 'visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotel_review_hotel
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_hotel_review_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL,
    CONSTRAINT chk_hotel_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_hotel_reviews_hotel_created ON hotel_reviews (hotel_id, created_at);

-- 9) TOUR_ITINERARIES
CREATE TABLE tour_itineraries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tour_id BIGINT UNSIGNED NOT NULL,
    day_number INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ti_tour_day (tour_id, day_number),
    CONSTRAINT fk_ti_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE CASCADE
);

CREATE INDEX idx_ti_tour_day ON tour_itineraries (tour_id, day_number);

-- 10) TOUR_ITINERARY_HOTELS
CREATE TABLE tour_itinerary_hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    itinerary_id BIGINT UNSIGNED NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    night_count INT UNSIGNED NULL,
    CONSTRAINT fk_tih_itinerary
      FOREIGN KEY (itinerary_id) REFERENCES tour_itineraries(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_tih_hotel
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      ON DELETE RESTRICT
);

CREATE INDEX idx_tih_itinerary ON tour_itinerary_hotels (itinerary_id);
CREATE INDEX idx_tih_hotel ON tour_itinerary_hotels (hotel_id);

-- 11) BOOKINGS
CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    tour_id BIGINT UNSIGNED NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(191) NOT NULL,
    adult_count INT UNSIGNED NOT NULL DEFAULT 1,
    child_count INT UNSIGNED NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    booking_status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
    payment_status ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bookings_code (booking_code),
    CONSTRAINT fk_booking_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_booking_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE RESTRICT,
    CONSTRAINT chk_passenger_count CHECK (adult_count + child_count > 0)
);

CREATE INDEX idx_bookings_user_created ON bookings (user_id, created_at);
CREATE INDEX idx_bookings_tour_status ON bookings (tour_id, booking_status);

-- 12) HOTEL_BOOKINGS
CREATE TABLE hotel_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(191) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_count INT UNSIGNED NOT NULL DEFAULT 1,
    guest_count INT UNSIGNED NOT NULL DEFAULT 1,
    payment_method ENUM('vnpay','cod') NOT NULL DEFAULT 'cod',
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    booking_status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
    payment_status ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hotel_bookings_code (booking_code),
    CONSTRAINT fk_hotel_booking_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_hotel_booking_hotel
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      ON DELETE RESTRICT,
    CONSTRAINT chk_hotel_booking_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT chk_hotel_guest_room_count CHECK (room_count > 0 AND guest_count > 0)
);

CREATE INDEX idx_hotel_bookings_user_created ON hotel_bookings (user_id, created_at);
CREATE INDEX idx_hotel_bookings_hotel_status ON hotel_bookings (hotel_id, booking_status);
CREATE INDEX idx_hotel_bookings_date_range ON hotel_bookings (check_in_date, check_out_date);

-- Gắn đánh giá với đơn đặt phòng (một đơn tối đa một đánh giá có booking_id)
ALTER TABLE hotel_reviews
  ADD COLUMN hotel_booking_id BIGINT UNSIGNED NULL,
  ADD UNIQUE INDEX uq_hotel_reviews_booking (hotel_booking_id),
  ADD CONSTRAINT fk_hotel_review_booking
    FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id) ON DELETE SET NULL;

-- 13) PAYMENTS
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NULL,
    hotel_booking_id BIGINT UNSIGNED NULL,
    provider ENUM('vnpay','cod') NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_status ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at DATETIME NULL,
    raw_response JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payments_transaction_ref (transaction_ref),
    CONSTRAINT fk_payment_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_payment_hotel_booking
      FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id)
      ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking_status ON payments (booking_id, payment_status);
CREATE INDEX idx_payments_hotel_booking_status ON payments (hotel_booking_id, payment_status);
-- Nếu DB cũ còn provider enum có 'momo'/'paypal' thì chạy:
-- ALTER TABLE payments
--   MODIFY provider ENUM('vnpay','cod') NOT NULL;

-- 14) INVOICES
CREATE TABLE invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL,
    booking_id BIGINT UNSIGNED NULL,
    hotel_booking_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    billing_name VARCHAR(150) NOT NULL,
    billing_phone VARCHAR(20) NULL,
    billing_email VARCHAR(191) NULL,
    billing_address VARCHAR(255) NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invoices_invoice_no (invoice_no),
    UNIQUE KEY uq_invoices_booking (booking_id),
    UNIQUE KEY uq_invoices_hotel_booking (hotel_booking_id),
    CONSTRAINT fk_invoice_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_hotel_booking
      FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_payment
      FOREIGN KEY (payment_id) REFERENCES payments(id)
      ON DELETE SET NULL
);

CREATE INDEX idx_invoices_user_created ON invoices (user_id, created_at);

-- 14) REVIEWS
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tour_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    reviewer_name VARCHAR(150) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    status ENUM('visible','hidden') NOT NULL DEFAULT 'visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_tour
      FOREIGN KEY (tour_id) REFERENCES tours(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_review_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_reviews_tour_created ON reviews (tour_id, created_at);
