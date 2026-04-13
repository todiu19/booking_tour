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
    departure_location VARCHAR(150),
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    destination_list JSON NULL, -- e.g. ["Da Nang","Hoi An"]
    status ENUM('published','archived') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tours_code (code)
);

-- 4) TOUR_IMAGES (one-to-many)
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

-- 5) DESTINATIONS
CREATE TABLE destinations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    province VARCHAR(150),
    country VARCHAR(150) DEFAULT 'Viet Nam',
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_destination_name_province_country (name, province, country)
);

-- Nếu DB đã tạo từ schema cũ, chạy thêm:
-- ALTER TABLE destinations ADD COLUMN image_url VARCHAR(500) NULL AFTER country;

-- 6) TOUR_DESTINATIONS (many-to-many)
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

-- 7) BOOKINGS
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

-- 8) PAYMENTS
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
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
      ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking_status ON payments (booking_id, payment_status);
-- Nếu DB cũ còn provider enum có 'momo'/'paypal' thì chạy:
-- ALTER TABLE payments
--   MODIFY provider ENUM('vnpay','cod') NOT NULL;

-- 9) INVOICES
CREATE TABLE invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL,
    booking_id BIGINT UNSIGNED NOT NULL,
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
    CONSTRAINT fk_invoice_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_payment
      FOREIGN KEY (payment_id) REFERENCES payments(id)
      ON DELETE SET NULL
);

CREATE INDEX idx_invoices_user_created ON invoices (user_id, created_at);

-- 10) REVIEWS
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
