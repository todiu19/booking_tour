-- Compatibility fix: some old schemas still require bookings.tour_schedule_id NOT NULL,
-- while current booking flow creates booking by tour_id only.
SET @has_tour_schedule_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'tour_schedule_id'
);
SET @sql_fix_tour_schedule := IF(
    @has_tour_schedule_col > 0,
    'ALTER TABLE bookings MODIFY COLUMN tour_schedule_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE stmt_fix_tour_schedule FROM @sql_fix_tour_schedule;
EXECUTE stmt_fix_tour_schedule;
DEALLOCATE PREPARE stmt_fix_tour_schedule;

-- Compatibility fix: remove legacy departure_location from tours if it still exists.
SET @has_departure_location_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tours'
      AND COLUMN_NAME = 'departure_location'
);
SET @sql_drop_departure_location := IF(
    @has_departure_location_col > 0,
    'ALTER TABLE tours DROP COLUMN departure_location',
    'SELECT 1'
);
PREPARE stmt_drop_departure_location FROM @sql_drop_departure_location;
EXECUTE stmt_drop_departure_location;
DEALLOCATE PREPARE stmt_drop_departure_location;

-- Compatibility fix: ensure tours.departure_date exists for new schedule feature.
SET @has_departure_date_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tours'
      AND COLUMN_NAME = 'departure_date'
);
SET @sql_add_departure_date := IF(
    @has_departure_date_col = 0,
    'ALTER TABLE tours ADD COLUMN departure_date DATE NULL AFTER duration_days',
    'SELECT 1'
);
PREPARE stmt_add_departure_date FROM @sql_add_departure_date;
EXECUTE stmt_add_departure_date;
DEALLOCATE PREPARE stmt_add_departure_date;

-- Compatibility fix: điểm xuất phát (HN / HCM / ĐN) tách với destination_list (tuyến tham quan).
SET @has_departure_point_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tours'
      AND COLUMN_NAME = 'departure_point'
);
SET @sql_add_departure_point := IF(
    @has_departure_point_col = 0,
    'ALTER TABLE tours ADD COLUMN departure_point VARCHAR(64) NULL AFTER destination_list',
    'SELECT 1'
);
PREPARE stmt_add_departure_point FROM @sql_add_departure_point;
EXECUTE stmt_add_departure_point;
DEALLOCATE PREPARE stmt_add_departure_point;

-- Compatibility fix: create hotels + itinerary tables when DB was initialized from old schema.
CREATE TABLE IF NOT EXISTS hotel_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    UNIQUE KEY uq_hotel_types_code (code)
);

INSERT IGNORE INTO hotel_types (code, name) VALUES
('villa', 'Biệt thự'),
('hotel', 'Hotel'),
('apartment', 'Căn hộ'),
('guesthouse', 'Nhà nghỉ'),
('resort', 'Khu nghỉ dưỡng');

CREATE TABLE IF NOT EXISTS hotels (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @has_hotel_description_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'description'
);
SET @sql_add_hotel_description := IF(
    @has_hotel_description_col = 0,
    'ALTER TABLE hotels ADD COLUMN description TEXT NULL AFTER address',
    'SELECT 1'
);
PREPARE stmt_add_hotel_description FROM @sql_add_hotel_description;
EXECUTE stmt_add_hotel_description;
DEALLOCATE PREPARE stmt_add_hotel_description;

SET @has_hotel_location_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'location'
);
SET @sql_add_hotel_location := IF(
    @has_hotel_location_col = 0,
    'ALTER TABLE hotels ADD COLUMN location VARCHAR(255) NULL AFTER address',
    'SELECT 1'
);
PREPARE stmt_add_hotel_location FROM @sql_add_hotel_location;
EXECUTE stmt_add_hotel_location;
DEALLOCATE PREPARE stmt_add_hotel_location;

SET @has_hotel_base_price_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'base_price'
);
SET @sql_add_hotel_base_price := IF(
    @has_hotel_base_price_col = 0,
    'ALTER TABLE hotels ADD COLUMN base_price DECIMAL(12,2) NULL AFTER description',
    'SELECT 1'
);
PREPARE stmt_add_hotel_base_price FROM @sql_add_hotel_base_price;
EXECUTE stmt_add_hotel_base_price;
DEALLOCATE PREPARE stmt_add_hotel_base_price;

SET @has_hotel_room_capacity_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'room_capacity'
);
SET @sql_add_hotel_room_capacity := IF(
    @has_hotel_room_capacity_col = 0,
    'ALTER TABLE hotels ADD COLUMN room_capacity INT UNSIGNED NULL AFTER base_price',
    'SELECT 1'
);
PREPARE stmt_add_hotel_room_capacity FROM @sql_add_hotel_room_capacity;
EXECUTE stmt_add_hotel_room_capacity;
DEALLOCATE PREPARE stmt_add_hotel_room_capacity;

SET @has_hotel_status_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'status'
);
SET @sql_add_hotel_status_col := IF(
    @has_hotel_status_col = 0,
    'ALTER TABLE hotels ADD COLUMN status ENUM(''active'',''blocked'') NOT NULL DEFAULT ''active'' AFTER room_capacity',
    'SELECT 1'
);
PREPARE stmt_add_hotel_status_col FROM @sql_add_hotel_status_col;
EXECUTE stmt_add_hotel_status_col;
DEALLOCATE PREPARE stmt_add_hotel_status_col;

SET @has_hotel_destination_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'destination_id'
);
SET @sql_add_hotel_destination_col := IF(
    @has_hotel_destination_col = 0,
    'ALTER TABLE hotels ADD COLUMN destination_id BIGINT UNSIGNED NULL AFTER room_capacity',
    'SELECT 1'
);
PREPARE stmt_add_hotel_destination_col FROM @sql_add_hotel_destination_col;
EXECUTE stmt_add_hotel_destination_col;
DEALLOCATE PREPARE stmt_add_hotel_destination_col;

SET @has_hotel_type_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'hotel_type_id'
);
SET @sql_add_hotel_type_col := IF(
    @has_hotel_type_col = 0,
    'ALTER TABLE hotels ADD COLUMN hotel_type_id BIGINT UNSIGNED NULL AFTER destination_id',
    'SELECT 1'
);
PREPARE stmt_add_hotel_type_col FROM @sql_add_hotel_type_col;
EXECUTE stmt_add_hotel_type_col;
DEALLOCATE PREPARE stmt_add_hotel_type_col;

SET @has_hotel_stars_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND COLUMN_NAME = 'stars'
);
SET @sql_drop_hotel_stars := IF(
    @has_hotel_stars_col > 0,
    'ALTER TABLE hotels DROP COLUMN stars',
    'SELECT 1'
);
PREPARE stmt_drop_hotel_stars FROM @sql_drop_hotel_stars;
EXECUTE stmt_drop_hotel_stars;
DEALLOCATE PREPARE stmt_drop_hotel_stars;

SET @has_fk_hotel_destination := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND CONSTRAINT_NAME = 'fk_hotel_destination'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_add_fk_hotel_destination := IF(
    @has_fk_hotel_destination = 0,
    'ALTER TABLE hotels
       ADD CONSTRAINT fk_hotel_destination
       FOREIGN KEY (destination_id) REFERENCES destinations(id)
       ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_add_fk_hotel_destination FROM @sql_add_fk_hotel_destination;
EXECUTE stmt_add_fk_hotel_destination;
DEALLOCATE PREPARE stmt_add_fk_hotel_destination;

SET @has_fk_hotel_type := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotels'
      AND CONSTRAINT_NAME = 'fk_hotel_type'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_add_fk_hotel_type := IF(
    @has_fk_hotel_type = 0,
    'ALTER TABLE hotels
       ADD CONSTRAINT fk_hotel_type
       FOREIGN KEY (hotel_type_id) REFERENCES hotel_types(id)
       ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_add_fk_hotel_type FROM @sql_add_fk_hotel_type;
EXECUTE stmt_add_fk_hotel_type;
DEALLOCATE PREPARE stmt_add_fk_hotel_type;

CREATE TABLE IF NOT EXISTS hotel_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_hotel_images_hotel
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      ON DELETE CASCADE
);

SET @has_hotel_images_order_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_images'
      AND INDEX_NAME = 'idx_hotel_images_hotel_order'
);
SET @sql_add_hotel_images_order_idx := IF(
    @has_hotel_images_order_idx = 0,
    'CREATE INDEX idx_hotel_images_hotel_order ON hotel_images (hotel_id, display_order)',
    'SELECT 1'
);
PREPARE stmt_add_hotel_images_order_idx FROM @sql_add_hotel_images_order_idx;
EXECUTE stmt_add_hotel_images_order_idx;
DEALLOCATE PREPARE stmt_add_hotel_images_order_idx;

-- Cleanup duplicated image rows from older seeds before adding unique constraint.
DELETE hi
FROM hotel_images hi
JOIN hotel_images hj
  ON hi.hotel_id = hj.hotel_id
 AND hi.image_url = hj.image_url
 AND hi.id > hj.id;

SET @has_hotel_images_unique_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_images'
      AND INDEX_NAME = 'uq_hotel_images_hotel_url'
);
SET @sql_add_hotel_images_unique_idx := IF(
    @has_hotel_images_unique_idx = 0,
    'CREATE UNIQUE INDEX uq_hotel_images_hotel_url ON hotel_images (hotel_id, image_url)',
    'SELECT 1'
);
PREPARE stmt_add_hotel_images_unique_idx FROM @sql_add_hotel_images_unique_idx;
EXECUTE stmt_add_hotel_images_unique_idx;
DEALLOCATE PREPARE stmt_add_hotel_images_unique_idx;

CREATE TABLE IF NOT EXISTS hotel_reviews (
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
      ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hotel_bookings (
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
      ON DELETE RESTRICT
);

SET @has_hotel_bookings_user_created_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_bookings'
      AND INDEX_NAME = 'idx_hotel_bookings_user_created'
);
SET @sql_add_hotel_bookings_user_created_idx := IF(
    @has_hotel_bookings_user_created_idx = 0,
    'CREATE INDEX idx_hotel_bookings_user_created ON hotel_bookings (user_id, created_at)',
    'SELECT 1'
);
PREPARE stmt_add_hotel_bookings_user_created_idx FROM @sql_add_hotel_bookings_user_created_idx;
EXECUTE stmt_add_hotel_bookings_user_created_idx;
DEALLOCATE PREPARE stmt_add_hotel_bookings_user_created_idx;

SET @has_hotel_bookings_hotel_status_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_bookings'
      AND INDEX_NAME = 'idx_hotel_bookings_hotel_status'
);
SET @sql_add_hotel_bookings_hotel_status_idx := IF(
    @has_hotel_bookings_hotel_status_idx = 0,
    'CREATE INDEX idx_hotel_bookings_hotel_status ON hotel_bookings (hotel_id, booking_status)',
    'SELECT 1'
);
PREPARE stmt_add_hotel_bookings_hotel_status_idx FROM @sql_add_hotel_bookings_hotel_status_idx;
EXECUTE stmt_add_hotel_bookings_hotel_status_idx;
DEALLOCATE PREPARE stmt_add_hotel_bookings_hotel_status_idx;

SET @has_hotel_bookings_date_range_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_bookings'
      AND INDEX_NAME = 'idx_hotel_bookings_date_range'
);
SET @sql_add_hotel_bookings_date_range_idx := IF(
    @has_hotel_bookings_date_range_idx = 0,
    'CREATE INDEX idx_hotel_bookings_date_range ON hotel_bookings (check_in_date, check_out_date)',
    'SELECT 1'
);
PREPARE stmt_add_hotel_bookings_date_range_idx FROM @sql_add_hotel_bookings_date_range_idx;
EXECUTE stmt_add_hotel_bookings_date_range_idx;
DEALLOCATE PREPARE stmt_add_hotel_bookings_date_range_idx;

SET @has_hotel_bookings_payment_method_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_bookings'
      AND COLUMN_NAME = 'payment_method'
);
SET @sql_add_hotel_bookings_payment_method_col := IF(
    @has_hotel_bookings_payment_method_col = 0,
    'ALTER TABLE hotel_bookings ADD COLUMN payment_method ENUM(''vnpay'',''cod'') NOT NULL DEFAULT ''cod'' AFTER guest_count',
    'SELECT 1'
);
PREPARE stmt_add_hotel_bookings_payment_method_col FROM @sql_add_hotel_bookings_payment_method_col;
EXECUTE stmt_add_hotel_bookings_payment_method_col;
DEALLOCATE PREPARE stmt_add_hotel_bookings_payment_method_col;

SET @has_payment_booking_nullable := (
    SELECT IFNULL(IS_NULLABLE = 'YES', 0)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND COLUMN_NAME = 'booking_id'
    LIMIT 1
);
SET @sql_payment_booking_nullable := IF(
    @has_payment_booking_nullable = 0,
    'ALTER TABLE payments MODIFY COLUMN booking_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE stmt_payment_booking_nullable FROM @sql_payment_booking_nullable;
EXECUTE stmt_payment_booking_nullable;
DEALLOCATE PREPARE stmt_payment_booking_nullable;

SET @has_payment_hotel_booking_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND COLUMN_NAME = 'hotel_booking_id'
);
SET @sql_add_payment_hotel_booking_col := IF(
    @has_payment_hotel_booking_col = 0,
    'ALTER TABLE payments ADD COLUMN hotel_booking_id BIGINT UNSIGNED NULL AFTER booking_id',
    'SELECT 1'
);
PREPARE stmt_add_payment_hotel_booking_col FROM @sql_add_payment_hotel_booking_col;
EXECUTE stmt_add_payment_hotel_booking_col;
DEALLOCATE PREPARE stmt_add_payment_hotel_booking_col;

SET @has_idx_payments_hotel_booking_status := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND INDEX_NAME = 'idx_payments_hotel_booking_status'
);
SET @sql_add_idx_payments_hotel_booking_status := IF(
    @has_idx_payments_hotel_booking_status = 0,
    'CREATE INDEX idx_payments_hotel_booking_status ON payments (hotel_booking_id, payment_status)',
    'SELECT 1'
);
PREPARE stmt_add_idx_payments_hotel_booking_status FROM @sql_add_idx_payments_hotel_booking_status;
EXECUTE stmt_add_idx_payments_hotel_booking_status;
DEALLOCATE PREPARE stmt_add_idx_payments_hotel_booking_status;

SET @has_fk_payment_hotel_booking := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND CONSTRAINT_NAME = 'fk_payment_hotel_booking'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_add_fk_payment_hotel_booking := IF(
    @has_fk_payment_hotel_booking = 0,
    'ALTER TABLE payments ADD CONSTRAINT fk_payment_hotel_booking FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt_add_fk_payment_hotel_booking FROM @sql_add_fk_payment_hotel_booking;
EXECUTE stmt_add_fk_payment_hotel_booking;
DEALLOCATE PREPARE stmt_add_fk_payment_hotel_booking;

SET @has_invoice_booking_nullable := (
    SELECT IFNULL(IS_NULLABLE = 'YES', 0)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoices'
      AND COLUMN_NAME = 'booking_id'
    LIMIT 1
);
SET @sql_invoice_booking_nullable := IF(
    @has_invoice_booking_nullable = 0,
    'ALTER TABLE invoices MODIFY COLUMN booking_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE stmt_invoice_booking_nullable FROM @sql_invoice_booking_nullable;
EXECUTE stmt_invoice_booking_nullable;
DEALLOCATE PREPARE stmt_invoice_booking_nullable;

SET @has_invoice_hotel_booking_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoices'
      AND COLUMN_NAME = 'hotel_booking_id'
);
SET @sql_add_invoice_hotel_booking_col := IF(
    @has_invoice_hotel_booking_col = 0,
    'ALTER TABLE invoices ADD COLUMN hotel_booking_id BIGINT UNSIGNED NULL AFTER booking_id',
    'SELECT 1'
);
PREPARE stmt_add_invoice_hotel_booking_col FROM @sql_add_invoice_hotel_booking_col;
EXECUTE stmt_add_invoice_hotel_booking_col;
DEALLOCATE PREPARE stmt_add_invoice_hotel_booking_col;

SET @has_uq_invoices_hotel_booking := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoices'
      AND INDEX_NAME = 'uq_invoices_hotel_booking'
);
SET @sql_add_uq_invoices_hotel_booking := IF(
    @has_uq_invoices_hotel_booking = 0,
    'CREATE UNIQUE INDEX uq_invoices_hotel_booking ON invoices (hotel_booking_id)',
    'SELECT 1'
);
PREPARE stmt_add_uq_invoices_hotel_booking FROM @sql_add_uq_invoices_hotel_booking;
EXECUTE stmt_add_uq_invoices_hotel_booking;
DEALLOCATE PREPARE stmt_add_uq_invoices_hotel_booking;

SET @has_fk_invoice_hotel_booking := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoices'
      AND CONSTRAINT_NAME = 'fk_invoice_hotel_booking'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_add_fk_invoice_hotel_booking := IF(
    @has_fk_invoice_hotel_booking = 0,
    'ALTER TABLE invoices ADD CONSTRAINT fk_invoice_hotel_booking FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id) ON DELETE RESTRICT',
    'SELECT 1'
);
PREPARE stmt_add_fk_invoice_hotel_booking FROM @sql_add_fk_invoice_hotel_booking;
EXECUTE stmt_add_fk_invoice_hotel_booking;
DEALLOCATE PREPARE stmt_add_fk_invoice_hotel_booking;

SET @hr_has_booking_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_reviews'
      AND COLUMN_NAME = 'hotel_booking_id'
);
SET @sql_hr_add_booking_col := IF(
    @hr_has_booking_col = 0,
    'ALTER TABLE hotel_reviews ADD COLUMN hotel_booking_id BIGINT UNSIGNED NULL, ADD UNIQUE INDEX uq_hotel_reviews_booking (hotel_booking_id), ADD CONSTRAINT fk_hotel_review_booking FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_hr_add_booking_col FROM @sql_hr_add_booking_col;
EXECUTE stmt_hr_add_booking_col;
DEALLOCATE PREPARE stmt_hr_add_booking_col;

CREATE TABLE IF NOT EXISTS tour_itineraries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tour_id BIGINT UNSIGNED NOT NULL,
    day_number INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ti_tour_day (tour_id, day_number),
    CONSTRAINT fk_ti_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_itinerary_hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    itinerary_id BIGINT UNSIGNED NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    night_count INT UNSIGNED NULL,
    CONSTRAINT fk_tih_itinerary FOREIGN KEY (itinerary_id) REFERENCES tour_itineraries(id) ON DELETE CASCADE,
    CONSTRAINT fk_tih_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT
);

SET @has_ti_unique := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tour_itineraries'
      AND INDEX_NAME = 'uq_ti_tour_day'
);
SET @sql_add_ti_unique := IF(
    @has_ti_unique = 0,
    'ALTER TABLE tour_itineraries ADD UNIQUE KEY uq_ti_tour_day (tour_id, day_number)',
    'SELECT 1'
);
PREPARE stmt_add_ti_unique FROM @sql_add_ti_unique;
EXECUTE stmt_add_ti_unique;
DEALLOCATE PREPARE stmt_add_ti_unique;

-- Roles (default for new users: customer)
INSERT IGNORE INTO roles (name) VALUES ('customer');
INSERT IGNORE INTO roles (name) VALUES ('admin');

-- Tài khoản admin mặc định (INSERT IGNORE: bỏ qua nếu trùng email/phone)
-- Đăng nhập: admin@booking.local / Admin@123 — nên đổi mật khẩu sau khi deploy thật
INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
SELECT 'Administrator', 'admin@booking.local', '0900000001',
       '$2y$10$ywAtckODPVvrf9ET.5Emy.ciqrq6am/8fYKwJ7uk2CUX5NuIPH4mq',
       r.id, 'active'
FROM roles r
WHERE r.name = 'admin'
LIMIT 1;

-- Đảm bảo tài khoản admin luôn có role admin (sửa DB cũ nếu từng gán sai)
UPDATE users u
INNER JOIN roles r ON r.name = 'admin'
SET u.role_id = r.id
WHERE u.email = 'admin@booking.local';

-- User mẫu (role customer), mật khẩu: User@123
INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
SELECT 'Nguyễn Văn A', 'customer1@example.com', '0900000002',
       '$2y$10$24S61wVeYPAk3QCZ.r3X.eYoVM3XEyVzd1T7y3xla7eKHoQDJzZmm',
       r.id, 'active'
FROM roles r WHERE r.name = 'customer' LIMIT 1;

INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
SELECT 'Trần Thị B', 'customer2@example.com', '0900000003',
       '$2y$10$24S61wVeYPAk3QCZ.r3X.eYoVM3XEyVzd1T7y3xla7eKHoQDJzZmm',
       r.id, 'active'
FROM roles r WHERE r.name = 'customer' LIMIT 1;

INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
SELECT 'Lê Văn C', 'customer3@example.com', '0900000004',
       '$2y$10$24S61wVeYPAk3QCZ.r3X.eYoVM3XEyVzd1T7y3xla7eKHoQDJzZmm',
       r.id, 'active'
FROM roles r WHERE r.name = 'customer' LIMIT 1;

-- Sample tours (INSERT IGNORE: safe to re-run; skips rows with existing code)
-- departure_point: nơi tập trung / xuất phát — ghi một lần ở đầu tên; không lặp lại điểm xuất phát trong các đoạn sau (vd Đà Nẵng - hội an, không đà nẵng - đà nẵng - hội an).
INSERT IGNORE INTO tours (code, name, description, duration_days, base_price, destination_list, departure_point, status) VALUES
('VN-DN-HA-01', 'Đà Nẵng - hội an - bà nà hills 4N3Đ', 'Tham quan biển Mỹ Khê, phố cổ Hội An, Cầu Vàng Bà Nà Hills.', 4, 4590000.00, '["Hội An","Bà Nà Hills"]', 'Đà Nẵng', 'published'),
('VN-HL-HP-02', 'Hà Nội - hạ long - hải phòng 3N2Đ', 'Du thuyền vịnh Hạ Long, hang Sửng Sốt, làng chài.', 3, 3290000.00, '["Hạ Long","Hải Phòng"]', 'Hà Nội', 'published'),
('VN-SGN-MEK-03', 'TP HCM - cần thơ - vĩnh long 2N1Đ', 'Cần Thơ, chợ nổi Cái Răng, vườn trái cây.', 2, 1890000.00, '["Cần Thơ","Vĩnh Long"]', 'TP HCM', 'published'),
('VN-SAPA-04', 'Hà Nội - sapa - fansipan 3N2Đ', 'Bản Cát Cát, đỉnh Fansipan, ruộng bậc thang Mường Hoa.', 3, 4190000.00, '["Sapa","Lào Cai"]', 'Hà Nội', 'published'),
('VN-PQ-05', 'TP HCM - phú quốc 4N3Đ', 'Bãi Sao, VinWonders, nhà tù Phú Quốc, hoàng hôn Dinh Cậu.', 4, 5990000.00, '["Phú Quốc"]', 'TP HCM', 'published'),
('VN-HUE-DN-06', 'Đà Nẵng - huế - lăng cô 5N4Đ', 'Đại Nội, lăng Khải Định, sông Hương, Ngũ Hành Sơn.', 5, 5490000.00, '["Huế","Lăng Cô"]', 'Đà Nẵng', 'published'),
('VN-QN-PY-07', 'Đà Nẵng - quy nhơn - phú yên 4N3Đ', 'Eo Gió, Kỳ Co, Ghềnh Đá Đĩa, trải nghiệm ẩm thực miền biển.', 4, 4990000.00, '["Quy Nhơn","Phú Yên"]', 'Đà Nẵng', 'published'),
('VN-NT-DL-08', 'TP HCM - nha trang - đà lạt 5N4Đ', 'Biển Nha Trang, Vinpearl, cao nguyên Đà Lạt, hồ Tuyền Lâm.', 5, 6390000.00, '["Nha Trang","Đà Lạt"]', 'TP HCM', 'published'),
('VN-HCM-PHAN-09', 'TP HCM - phan thiết - mũi né 3N2Đ', 'Đồi cát Mũi Né, làng chài, suối Tiên, nghỉ dưỡng biển.', 3, 2890000.00, '["Phan Thiết","Mũi Né"]', 'TP HCM', 'published'),
('VN-HN-NB-10', 'Hà Nội - ninh bình - tràng an 2N1Đ', 'Tràng An, Bái Đính, Hang Múa, non nước hữu tình.', 2, 2190000.00, '["Ninh Bình","Tràng An"]', 'Hà Nội', 'published'),
('VN-HCM-CT-11', 'TP HCM - côn đảo 3N2Đ', 'Viếng nghĩa trang Hàng Dương, bãi Đầm Trầu, lặn ngắm san hô.', 3, 7390000.00, '["Côn Đảo"]', 'TP HCM', 'published'),
('VN-HCM-PLEI-12', 'TP HCM - gia lai - kon tum 4N3Đ', 'Biển Hồ, nhà rông Kon Klor, Măng Đen, văn hóa Tây Nguyên.', 4, 4590000.00, '["Gia Lai","Kon Tum"]', 'TP HCM', 'published');

-- Đồng bộ tên: điểm xuất phát ghi một lần ở đầu (khớp departure_point); các đoạn sau chỉ điểm trong tuyến, không lặp điểm xuất phát
UPDATE tours SET name = 'Đà Nẵng - hội an - bà nà hills 4N3Đ', departure_point = 'Đà Nẵng', destination_list = '["Hội An","Bà Nà Hills"]' WHERE code = 'VN-DN-HA-01';
UPDATE tours SET name = 'Hà Nội - hạ long - hải phòng 3N2Đ', departure_point = 'Hà Nội', destination_list = '["Hạ Long","Hải Phòng"]' WHERE code = 'VN-HL-HP-02';
UPDATE tours SET name = 'TP HCM - cần thơ - vĩnh long 2N1Đ', departure_point = 'TP HCM', destination_list = '["Cần Thơ","Vĩnh Long"]' WHERE code = 'VN-SGN-MEK-03';
UPDATE tours SET name = 'Hà Nội - sapa - fansipan 3N2Đ', departure_point = 'Hà Nội', destination_list = '["Sapa","Lào Cai"]' WHERE code = 'VN-SAPA-04';
UPDATE tours SET name = 'TP HCM - phú quốc 4N3Đ', departure_point = 'TP HCM', destination_list = '["Phú Quốc"]' WHERE code = 'VN-PQ-05';
UPDATE tours SET name = 'Đà Nẵng - huế - lăng cô 5N4Đ', departure_point = 'Đà Nẵng', destination_list = '["Huế","Lăng Cô"]' WHERE code = 'VN-HUE-DN-06';
UPDATE tours SET name = 'Đà Nẵng - quy nhơn - phú yên 4N3Đ', departure_point = 'Đà Nẵng', destination_list = '["Quy Nhơn","Phú Yên"]' WHERE code = 'VN-QN-PY-07';
UPDATE tours SET name = 'TP HCM - nha trang - đà lạt 5N4Đ', departure_point = 'TP HCM', destination_list = '["Nha Trang","Đà Lạt"]' WHERE code = 'VN-NT-DL-08';
UPDATE tours SET name = 'TP HCM - phan thiết - mũi né 3N2Đ', departure_point = 'TP HCM', destination_list = '["Phan Thiết","Mũi Né"]' WHERE code = 'VN-HCM-PHAN-09';
UPDATE tours SET name = 'Hà Nội - ninh bình - tràng an 2N1Đ', departure_point = 'Hà Nội', destination_list = '["Ninh Bình","Tràng An"]' WHERE code = 'VN-HN-NB-10';
UPDATE tours SET name = 'TP HCM - côn đảo 3N2Đ', departure_point = 'TP HCM', destination_list = '["Côn Đảo"]' WHERE code = 'VN-HCM-CT-11';
UPDATE tours SET name = 'TP HCM - gia lai - kon tum 4N3Đ', departure_point = 'TP HCM', destination_list = '["Gia Lai","Kon Tum"]' WHERE code = 'VN-HCM-PLEI-12';

UPDATE tours SET departure_date = '2026-05-10' WHERE code = 'VN-DN-HA-01';
UPDATE tours SET departure_date = '2026-06-14' WHERE code = 'VN-HL-HP-02';
UPDATE tours SET departure_date = '2026-05-03' WHERE code = 'VN-SGN-MEK-03';
UPDATE tours SET departure_date = '2026-05-22' WHERE code = 'VN-SAPA-04';
UPDATE tours SET departure_date = '2026-07-02' WHERE code = 'VN-PQ-05';
UPDATE tours SET departure_date = '2026-06-01' WHERE code = 'VN-HUE-DN-06';
UPDATE tours SET departure_date = '2026-06-08' WHERE code = 'VN-QN-PY-07';
UPDATE tours SET departure_date = '2026-06-20' WHERE code = 'VN-NT-DL-08';
UPDATE tours SET departure_date = '2026-05-15' WHERE code = 'VN-HCM-PHAN-09';
UPDATE tours SET departure_date = '2026-05-18' WHERE code = 'VN-HN-NB-10';
UPDATE tours SET departure_date = '2026-07-12' WHERE code = 'VN-HCM-CT-11';
UPDATE tours SET departure_date = '2026-06-26' WHERE code = 'VN-HCM-PLEI-12';

-- Compatibility fix: create tour_departures if DB was initialized from old schema.
CREATE TABLE IF NOT EXISTS tour_departures (
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

-- Seed nhiều ngày xuất phát cho từng tour (idempotent với INSERT IGNORE).
INSERT IGNORE INTO tour_departures (tour_id, departure_date)
SELECT t.id, d.departure_date
FROM tours t
JOIN (
    SELECT 'VN-DN-HA-01' AS code, '2026-05-10' AS departure_date
    UNION ALL SELECT 'VN-DN-HA-01', '2026-05-24'
    UNION ALL SELECT 'VN-DN-HA-01', '2026-06-07'
    UNION ALL SELECT 'VN-HL-HP-02', '2026-06-14'
    UNION ALL SELECT 'VN-HL-HP-02', '2026-06-21'
    UNION ALL SELECT 'VN-HL-HP-02', '2026-06-28'
    UNION ALL SELECT 'VN-SGN-MEK-03', '2026-05-03'
    UNION ALL SELECT 'VN-SGN-MEK-03', '2026-05-17'
    UNION ALL SELECT 'VN-SGN-MEK-03', '2026-05-31'
    UNION ALL SELECT 'VN-SAPA-04', '2026-05-22'
    UNION ALL SELECT 'VN-SAPA-04', '2026-06-05'
    UNION ALL SELECT 'VN-SAPA-04', '2026-06-19'
    UNION ALL SELECT 'VN-PQ-05', '2026-07-02'
    UNION ALL SELECT 'VN-PQ-05', '2026-07-16'
    UNION ALL SELECT 'VN-PQ-05', '2026-07-30'
    UNION ALL SELECT 'VN-HUE-DN-06', '2026-06-01'
    UNION ALL SELECT 'VN-HUE-DN-06', '2026-06-15'
    UNION ALL SELECT 'VN-HUE-DN-06', '2026-06-29'
    UNION ALL SELECT 'VN-QN-PY-07', '2026-06-08'
    UNION ALL SELECT 'VN-QN-PY-07', '2026-06-22'
    UNION ALL SELECT 'VN-QN-PY-07', '2026-07-06'
    UNION ALL SELECT 'VN-NT-DL-08', '2026-06-20'
    UNION ALL SELECT 'VN-NT-DL-08', '2026-07-04'
    UNION ALL SELECT 'VN-NT-DL-08', '2026-07-18'
    UNION ALL SELECT 'VN-HCM-PHAN-09', '2026-05-15'
    UNION ALL SELECT 'VN-HCM-PHAN-09', '2026-05-29'
    UNION ALL SELECT 'VN-HCM-PHAN-09', '2026-06-12'
    UNION ALL SELECT 'VN-HN-NB-10', '2026-05-18'
    UNION ALL SELECT 'VN-HN-NB-10', '2026-05-25'
    UNION ALL SELECT 'VN-HN-NB-10', '2026-06-01'
    UNION ALL SELECT 'VN-HCM-CT-11', '2026-07-12'
    UNION ALL SELECT 'VN-HCM-CT-11', '2026-07-26'
    UNION ALL SELECT 'VN-HCM-CT-11', '2026-08-09'
    UNION ALL SELECT 'VN-HCM-PLEI-12', '2026-06-26'
    UNION ALL SELECT 'VN-HCM-PLEI-12', '2026-07-10'
    UNION ALL SELECT 'VN-HCM-PLEI-12', '2026-07-24'
) d ON d.code = t.code;

-- Sample images for tours (safe to re-run; duplicate URLs are skipped)
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528127269322-539801943592', 1 FROM tours t WHERE t.code = 'VN-DN-HA-01';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 2 FROM tours t WHERE t.code = 'VN-DN-HA-01';

INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1526481280695-3c46925f49d5', 1 FROM tours t WHERE t.code = 'VN-HL-HP-02';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8', 2 FROM tours t WHERE t.code = 'VN-HL-HP-02';

INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', 1 FROM tours t WHERE t.code = 'VN-SGN-MEK-03';

INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528127269322-539801943592', 1 FROM tours t WHERE t.code = 'VN-SAPA-04';

INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 1 FROM tours t WHERE t.code = 'VN-PQ-05';

INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1472396961693-142e6e269027', 1 FROM tours t WHERE t.code = 'VN-HUE-DN-06';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 1 FROM tours t WHERE t.code = 'VN-QN-PY-07';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 2 FROM tours t WHERE t.code = 'VN-QN-PY-07';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', 1 FROM tours t WHERE t.code = 'VN-NT-DL-08';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1493558103817-58b2924bce98', 2 FROM tours t WHERE t.code = 'VN-NT-DL-08';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21', 1 FROM tours t WHERE t.code = 'VN-HCM-PHAN-09';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 1 FROM tours t WHERE t.code = 'VN-HN-NB-10';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8', 1 FROM tours t WHERE t.code = 'VN-HCM-CT-11';
INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
SELECT t.id, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 1 FROM tours t WHERE t.code = 'VN-HCM-PLEI-12';

-- Compatibility fix: ensure destinations.description exists.
SET @has_destination_description_col := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'destinations'
      AND COLUMN_NAME = 'description'
);
SET @sql_add_destination_description := IF(
    @has_destination_description_col = 0,
    'ALTER TABLE destinations ADD COLUMN description TEXT NULL AFTER image_url',
    'SELECT 1'
);
PREPARE stmt_add_destination_description FROM @sql_add_destination_description;
EXECUTE stmt_add_destination_description;
DEALLOCATE PREPARE stmt_add_destination_description;

-- Sample destinations (re-runnable; matches unique constraint)
INSERT IGNORE INTO destinations (name, province, country, image_url, description) VALUES
('Đà Nẵng', 'Đà Nẵng', 'Viet Nam', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Thanh pho bien hien dai voi bai bien My Khe va cau Rong.'),
('Hội An', 'Quảng Nam', 'Viet Nam', 'https://images.unsplash.com/photo-1526481280695-3c46925f49d5', 'Pho co ven song Hoai voi den long va kien truc co kinh.'),
('Bà Nà Hills', 'Đà Nẵng', 'Viet Nam', 'https://images.unsplash.com/photo-1548013146-72479768bada', 'Khu du lich tren nui noi tieng voi Cau Vang va khi hau mat me.'),
('Hạ Long', 'Quảng Ninh', 'Viet Nam', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8', 'Di san thien nhien the gioi voi hang nghin dao da voi doc dao.'),
('Cát Bà', 'Hải Phòng', 'Viet Nam', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'Dao lon voi canh dep bien va rung quoc gia.'),
('Cần Thơ', 'Cần Thơ', 'Viet Nam', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', 'Trung tam mien Tay voi cho noi Cai Rang va van hoa song nuoc.'),
('Sapa', 'Lào Cai', 'Viet Nam', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'Thi tran nui voi ruong bac thang va khi hau se lanh quanh nam.'),
('Fansipan', 'Lào Cai', 'Viet Nam', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Noc nha Dong Duong voi canh quan hung vi cua day Hoang Lien Son.'),
('Phú Quốc', 'Kiên Giang', 'Viet Nam', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'Dao ngoc noi tieng voi bai bien dep va he thong resort nghi duong.'),
('Huế', 'Thừa Thiên Huế', 'Viet Nam', 'https://images.unsplash.com/photo-1472396961693-142e6e269027', 'Co do voi quan the di tich nha Nguyen va am thuc dac sac.'),
('Quy Nhơn', 'Bình Định', 'Viet Nam', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 'Thanh pho bien yen binh voi Eo Gio va Ky Co.'),
('Phú Yên', 'Phú Yên', 'Viet Nam', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'Vung dat ven bien hoang so voi Ganh Da Dia noi tieng.'),
('Nha Trang', 'Khánh Hòa', 'Viet Nam', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', 'Diem den bien du lich soi dong voi nhieu dao dep va dich vu lan bien.'),
('Đà Lạt', 'Lâm Đồng', 'Viet Nam', 'https://images.unsplash.com/photo-1493558103817-58b2924bce98', 'Thanh pho ngan hoa, khi hau mat me va phong canh doi nui lang man.'),
('Phan Thiết', 'Bình Thuận', 'Viet Nam', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21', 'Noi bat voi Mui Ne, doi cat va am thuc hai san tuoi ngon.'),
('Ninh Bình', 'Ninh Bình', 'Viet Nam', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 'Diem den noi tieng voi Trang An, Tam Coc va canh quan non nuoc huu tinh.'),
('Côn Đảo', 'Bà Rịa - Vũng Tàu', 'Viet Nam', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8', 'Quan dao xa bo voi bien xanh cat trang va dau an lich su.'),
('Gia Lai', 'Gia Lai', 'Viet Nam', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 'Vung dat cao nguyen voi bien ho va van hoa cong chieng Tay Nguyen.'),
('Kon Tum', 'Kon Tum', 'Viet Nam', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', 'Diem den Tay Nguyen voi nha rong, cau treo va ban lang dan toc.');

-- Tour ↔ destination links (re-runnable via primary key)
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Đà Nẵng' AND d.province = 'Đà Nẵng'
WHERE t.code = 'VN-DN-HA-01';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 2
FROM tours t
JOIN destinations d ON d.name = 'Hội An' AND d.province = 'Quảng Nam'
WHERE t.code = 'VN-DN-HA-01';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 3
FROM tours t
JOIN destinations d ON d.name = 'Bà Nà Hills' AND d.province = 'Đà Nẵng'
WHERE t.code = 'VN-DN-HA-01';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Hạ Long' AND d.province = 'Quảng Ninh'
WHERE t.code = 'VN-HL-HP-02';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 2
FROM tours t
JOIN destinations d ON d.name = 'Cát Bà' AND d.province = 'Hải Phòng'
WHERE t.code = 'VN-HL-HP-02';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Cần Thơ' AND d.province = 'Cần Thơ'
WHERE t.code = 'VN-SGN-MEK-03';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Sapa' AND d.province = 'Lào Cai'
WHERE t.code = 'VN-SAPA-04';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 2
FROM tours t
JOIN destinations d ON d.name = 'Fansipan' AND d.province = 'Lào Cai'
WHERE t.code = 'VN-SAPA-04';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Phú Quốc' AND d.province = 'Kiên Giang'
WHERE t.code = 'VN-PQ-05';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Huế' AND d.province = 'Thừa Thiên Huế'
WHERE t.code = 'VN-HUE-DN-06';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 3
FROM tours t
JOIN destinations d ON d.name = 'Đà Nẵng' AND d.province = 'Đà Nẵng'
WHERE t.code = 'VN-HUE-DN-06';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Quy Nhơn' AND d.province = 'Bình Định'
WHERE t.code = 'VN-QN-PY-07';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 2
FROM tours t
JOIN destinations d ON d.name = 'Phú Yên' AND d.province = 'Phú Yên'
WHERE t.code = 'VN-QN-PY-07';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Nha Trang' AND d.province = 'Khánh Hòa'
WHERE t.code = 'VN-NT-DL-08';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 3
FROM tours t
JOIN destinations d ON d.name = 'Đà Lạt' AND d.province = 'Lâm Đồng'
WHERE t.code = 'VN-NT-DL-08';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Phan Thiết' AND d.province = 'Bình Thuận'
WHERE t.code = 'VN-HCM-PHAN-09';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Ninh Bình' AND d.province = 'Ninh Bình'
WHERE t.code = 'VN-HN-NB-10';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Côn Đảo' AND d.province = 'Bà Rịa - Vũng Tàu'
WHERE t.code = 'VN-HCM-CT-11';

INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 1
FROM tours t
JOIN destinations d ON d.name = 'Gia Lai' AND d.province = 'Gia Lai'
WHERE t.code = 'VN-HCM-PLEI-12';
INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
SELECT t.id, d.id, 2
FROM tours t
JOIN destinations d ON d.name = 'Kon Tum' AND d.province = 'Kon Tum'
WHERE t.code = 'VN-HCM-PLEI-12';

-- Sample hotels
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 1, 'Da Nang Riverside Hotel', 'Đà Nẵng', 'Ven song Han',
       'Khach san ven song, gan trung tam thanh pho va cac diem tham quan chinh.',
       890000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'hotel'
WHERE d.name = 'Đà Nẵng' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 2, 'Hoi An Ancient House', 'Hội An', 'Pho co Hoi An',
       'Khach san phong cach co dien, thuan tien di bo pho co Hoi An.',
       820000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'guesthouse'
WHERE d.name = 'Hội An' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 3, 'Ha Long Bay Resort', 'Hạ Long', 'Bai Chay',
       'Khu nghi duong huong bien voi khong gian rong va dich vu day du.',
       1350000.00, 3, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'villa'
WHERE d.name = 'Hạ Long' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 4, 'Sapa Mountain View', 'Sapa', 'Trung tam Sapa',
       'Khach san tam nhin nui, phu hop cho hanh trinh kham pha Sapa - Fansipan.',
       760000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'hotel'
WHERE d.name = 'Sapa' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 5, 'Phu Quoc Beach Hotel', 'Phú Quốc', 'Gan bai Sao',
       'Khach san gan bai bien dep, phu hop nghi duong gia dinh va cap doi.',
       1280000.00, 3, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'apartment'
WHERE d.name = 'Phú Quốc' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 6, 'Hue Imperial Hotel', 'Huế', 'Gan Dai Noi',
       'Khach san trung tam Hue, de dang ket noi cac diem di san co do.',
       910000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'hotel'
WHERE d.name = 'Huế' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 7, 'Dalat Pine Hill Resort', 'Đà Lạt', 'Khu doi thong',
       'Khu nghi duong khong gian mo, khi hau mat me va gan trung tam Da Lat.',
       1180000.00, 3, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'resort'
WHERE d.name = 'Đà Lạt' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 8, 'Nha Trang Ocean View', 'Nha Trang', 'Tran Phu beach',
       'Khach san huong bien, phong rong, de di chuyen den cac diem vui choi.',
       990000.00, 3, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'hotel'
WHERE d.name = 'Nha Trang' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 9, 'Can Tho Riverside Stay', 'Cần Thơ', 'Ben Ninh Kieu',
       'Noi o ben song thoang mat, phu hop kham pha cho noi va am thuc mien Tay.',
       730000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'guesthouse'
WHERE d.name = 'Cần Thơ' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 10, 'Phan Thiet Sand Apartment', 'Phan Thiết', 'Mui Ne strip',
       'Can ho nghi duong co bep nho, phu hop nhom ban va gia dinh.',
       840000.00, 4, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'apartment'
WHERE d.name = 'Phan Thiết' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 11, 'Ninh Binh Eco Lodge', 'Ninh Bình', 'Tam Coc',
       'Lodge gan khu sinh thai, khong gian yen tinh va than thien.',
       860000.00, 2, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'villa'
WHERE d.name = 'Ninh Bình' LIMIT 1;
INSERT IGNORE INTO hotels (id, name, address, location, description, base_price, room_capacity, destination_id, hotel_type_id)
SELECT 12, 'Con Dao Sunrise Resort', 'Côn Đảo', 'Gan bai Dat Doc',
       'Resort bien co boi canh yen binh, dich vu nghi duong cao cap.',
       1620000.00, 3, d.id, ht.id
FROM destinations d
JOIN hotel_types ht ON ht.code = 'resort'
WHERE d.name = 'Côn Đảo' LIMIT 1;

-- Sample hotel images
INSERT INTO hotel_images (hotel_id, image_url, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 1),
(1, 'https://images.unsplash.com/photo-1455587734955-081b22074882', 2),
(2, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 1),
(2, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791', 2),
(3, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c', 1),
(3, 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a', 2),
(4, 'https://images.unsplash.com/photo-1501117716987-c8e1ecb2100f', 1),
(4, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 2),
(5, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 1),
(5, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 2),
(6, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', 1),
(7, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', 1),
(8, 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1', 1),
(9, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c', 1),
(10, 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a', 1),
(11, 'https://images.unsplash.com/photo-1470165518248-ff4e5d66b1b9', 1),
(12, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', 1)
ON DUPLICATE KEY UPDATE
  display_order = VALUES(display_order);

-- Sample hotel reviews (rating moved from hotels.stars -> hotel_reviews)
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 1, u.id, u.full_name, 5, 'Phong dep, sach se, nhan vien ho tro nhanh.', 'visible'
FROM users u
WHERE u.email = 'customer1@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM hotel_reviews hr
      WHERE hr.hotel_id = 1
        AND hr.user_id = u.id
  );
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 2, u.id, u.full_name, 4, 'Vi tri dep, gan pho co, dich vu on.', 'visible'
FROM users u
WHERE u.email = 'customer2@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM hotel_reviews hr
      WHERE hr.hotel_id = 2
        AND hr.user_id = u.id
  );
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 3, u.id, u.full_name, 5, 'Khung canh dep, buffet sang da dang.', 'visible'
FROM users u
WHERE u.email = 'customer3@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM hotel_reviews hr
      WHERE hr.hotel_id = 3
        AND hr.user_id = u.id
  );
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 4, NULL, 'Nguyen Minh', 4, 'Vi tri dep, phong gon gang va de di chuyen.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 4
      AND hr.reviewer_name = 'Nguyen Minh'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 5, NULL, 'Tran Huong', 5, 'Gan bien, phong rong, gia hop ly cho gia dinh.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 5
      AND hr.reviewer_name = 'Tran Huong'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 6, NULL, 'Le Bao', 4, 'Nhan vien lich su, do an sang on dinh.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 6
      AND hr.reviewer_name = 'Le Bao'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 7, NULL, 'Pham Anh', 5, 'Khong khi trong lanh, khong gian nghi duong dep.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 7
      AND hr.reviewer_name = 'Pham Anh'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 8, NULL, 'Do Quang', 4, 'Can phong sach se, view bien rat dep.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 8
      AND hr.reviewer_name = 'Do Quang'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 9, NULL, 'Bui Thanh', 3, 'Dich vu co ban tot, gia mem.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 9
      AND hr.reviewer_name = 'Bui Thanh'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 10, NULL, 'Hoang Long', 4, 'Can ho day du tien nghi, gan khu vui choi.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 10
      AND hr.reviewer_name = 'Hoang Long'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 11, NULL, 'Vo Ngan', 5, 'Khong gian yen tinh, phuc vu nhiet tinh.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 11
      AND hr.reviewer_name = 'Vo Ngan'
);
INSERT INTO hotel_reviews (hotel_id, user_id, reviewer_name, rating, comment, status)
SELECT 12, NULL, 'Dang Khoa', 5, 'Resort dep, trai nghiem nghi duong rat tot.', 'visible'
WHERE NOT EXISTS (
    SELECT 1
    FROM hotel_reviews hr
    WHERE hr.hotel_id = 12
      AND hr.reviewer_name = 'Dang Khoa'
);

-- Sample itineraries (tour schedule detail)
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Đón khách và tham quan trung tâm', 'Đón khách, nhận phòng, tham quan điểm nổi bật ngày 1'
FROM tours t WHERE t.code = 'VN-DN-HA-01'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 2, 'Khám phá Hội An', 'Di chuyển Hội An, tham quan phố cổ và ẩm thực địa phương'
FROM tours t WHERE t.code = 'VN-DN-HA-01'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Tham quan vịnh Hạ Long', 'Lên du thuyền, thăm hang động và hoạt động biển'
FROM tours t WHERE t.code = 'VN-HL-HP-02'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

-- Itinerary-hotel mapping
INSERT IGNORE INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 1, 1
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-DN-HA-01' AND ti.day_number = 1;

INSERT IGNORE INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 2, 1
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-DN-HA-01' AND ti.day_number = 2;

INSERT IGNORE INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 3, 2
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-HL-HP-02' AND ti.day_number = 1;

-- Additional sample itineraries for other tours
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Khởi hành và khám phá chợ nổi', 'Di chuyển đến Cần Thơ, trải nghiệm chợ nổi và ẩm thực miền Tây'
FROM tours t WHERE t.code = 'VN-SGN-MEK-03'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 2, 'Tham quan miệt vườn và làng nghề', 'Tham quan vườn trái cây, làng nghề truyền thống và sinh hoạt địa phương'
FROM tours t WHERE t.code = 'VN-SGN-MEK-03'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Bản Cát Cát và trung tâm Sapa', 'Nhận phòng, tham quan bản Cát Cát và dạo chợ đêm Sapa'
FROM tours t WHERE t.code = 'VN-SAPA-04'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 2, 'Chinh phục Fansipan', 'Di chuyển cáp treo lên Fansipan và khám phá khu du lịch trên đỉnh núi'
FROM tours t WHERE t.code = 'VN-SAPA-04'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Khám phá Bắc đảo Phú Quốc', 'Tham quan Grand World, safari và các bãi biển nổi bật phía Bắc đảo'
FROM tours t WHERE t.code = 'VN-PQ-05'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 2, 'Nam đảo và trải nghiệm biển', 'Cano tham quan đảo, lặn ngắm san hô và nghỉ dưỡng'
FROM tours t WHERE t.code = 'VN-PQ-05'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 1, 'Di sản cố đô Huế', 'Tham quan Đại Nội, chùa Thiên Mụ và thưởng thức ẩm thực cung đình'
FROM tours t WHERE t.code = 'VN-HUE-DN-06'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 2, 'Đèo Hải Vân - Đà Nẵng', 'Di chuyển qua đèo Hải Vân và check-in các điểm nổi tiếng Đà Nẵng'
FROM tours t WHERE t.code = 'VN-HUE-DN-06'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);
INSERT INTO tour_itineraries (tour_id, day_number, title, description)
SELECT t.id, 3, 'Bà Nà và mua sắm', 'Tham quan Bà Nà Hills, cầu Vàng và mua sắm trước khi kết thúc tour'
FROM tours t WHERE t.code = 'VN-HUE-DN-06'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

-- Additional itinerary-hotel mapping (idempotent)
INSERT INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 6, 1
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-SGN-MEK-03' AND ti.day_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM tour_itinerary_hotels tih
      WHERE tih.itinerary_id = ti.id AND tih.hotel_id = 6
  );

INSERT INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 4, 2
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-SAPA-04' AND ti.day_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM tour_itinerary_hotels tih
      WHERE tih.itinerary_id = ti.id AND tih.hotel_id = 4
  );

INSERT INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 5, 2
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-PQ-05' AND ti.day_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM tour_itinerary_hotels tih
      WHERE tih.itinerary_id = ti.id AND tih.hotel_id = 5
  );

INSERT INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 6, 1
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-HUE-DN-06' AND ti.day_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM tour_itinerary_hotels tih
      WHERE tih.itinerary_id = ti.id AND tih.hotel_id = 6
  );

INSERT INTO tour_itinerary_hotels (itinerary_id, hotel_id, night_count)
SELECT ti.id, 1, 2
FROM tour_itineraries ti
JOIN tours t ON t.id = ti.tour_id
WHERE t.code = 'VN-HUE-DN-06' AND ti.day_number = 2
  AND NOT EXISTS (
      SELECT 1 FROM tour_itinerary_hotels tih
      WHERE tih.itinerary_id = ti.id AND tih.hotel_id = 1
  );

-- Bookings seed compatible with both schemas:
-- - DB có cột bookings.tour_schedule_id: insert NULL
-- - DB không có cột đó: insert without that column
SET @sql_seed_booking_1 := IF(
    @has_tour_schedule_col > 0,
    'INSERT IGNORE INTO bookings (
      booking_code, user_id, tour_schedule_id, contact_name, contact_phone, contact_email,
      adult_count, child_count, total_amount, booking_status, payment_status, note, tour_id
    )
    SELECT
      ''BK-2026-0001'',
      u.id,
      NULL,
      u.full_name,
      u.phone,
      u.email,
      2, 0,
      t.base_price * 2,
      ''confirmed'',
      ''paid'',
      ''Yêu cầu phòng không hút thuốc (nếu có).'',
      t.id
    FROM users u
    JOIN tours t ON t.code = ''VN-DN-HA-01''
    WHERE u.email = ''customer1@example.com''',
    'INSERT IGNORE INTO bookings (
      booking_code, user_id, contact_name, contact_phone, contact_email,
      adult_count, child_count, total_amount, booking_status, payment_status, note, tour_id
    )
    SELECT
      ''BK-2026-0001'',
      u.id,
      u.full_name,
      u.phone,
      u.email,
      2, 0,
      t.base_price * 2,
      ''confirmed'',
      ''paid'',
      ''Yêu cầu phòng không hút thuốc (nếu có).'',
      t.id
    FROM users u
    JOIN tours t ON t.code = ''VN-DN-HA-01''
    WHERE u.email = ''customer1@example.com'''
);
PREPARE stmt_seed_booking_1 FROM @sql_seed_booking_1;
EXECUTE stmt_seed_booking_1;
DEALLOCATE PREPARE stmt_seed_booking_1;

SET @sql_seed_booking_2 := IF(
    @has_tour_schedule_col > 0,
    'INSERT IGNORE INTO bookings (
      booking_code, user_id, tour_schedule_id, contact_name, contact_phone, contact_email,
      adult_count, child_count, total_amount, booking_status, payment_status, note, tour_id
    )
    SELECT
      ''BK-2026-0002'',
      u.id,
      NULL,
      u.full_name,
      u.phone,
      u.email,
      1, 1,
      t.base_price * 2,
      ''pending'',
      ''unpaid'',
      ''Gọi trước khi đến điểm đón.'',
      t.id
    FROM users u
    JOIN tours t ON t.code = ''VN-SAPA-04''
    WHERE u.email = ''customer2@example.com''',
    'INSERT IGNORE INTO bookings (
      booking_code, user_id, contact_name, contact_phone, contact_email,
      adult_count, child_count, total_amount, booking_status, payment_status, note, tour_id
    )
    SELECT
      ''BK-2026-0002'',
      u.id,
      u.full_name,
      u.phone,
      u.email,
      1, 1,
      t.base_price * 2,
      ''pending'',
      ''unpaid'',
      ''Gọi trước khi đến điểm đón.'',
      t.id
    FROM users u
    JOIN tours t ON t.code = ''VN-SAPA-04''
    WHERE u.email = ''customer2@example.com'''
);
PREPARE stmt_seed_booking_2 FROM @sql_seed_booking_2;
EXECUTE stmt_seed_booking_2;
DEALLOCATE PREPARE stmt_seed_booking_2;

-- Payments for confirmed booking
INSERT IGNORE INTO payments (booking_id, provider, transaction_ref, amount, payment_status, paid_at, raw_response)
SELECT
  b.id,
  'vnpay',
  'VNPAY-2026-0001',
  b.total_amount,
  'success',
  NOW(),
  JSON_OBJECT('sandbox', true, 'note', 'seed data')
FROM bookings b
WHERE b.booking_code = 'BK-2026-0001';

-- Invoices for confirmed booking
INSERT IGNORE INTO invoices (
  invoice_no, booking_id, user_id, payment_id, issued_at,
  subtotal_amount, tax_amount, total_amount,
  billing_name, billing_phone, billing_email, billing_address, note
)
SELECT
  'INV-2026-0001',
  b.id,
  b.user_id,
  p.id,
  NOW(),
  b.total_amount,
  0.00,
  b.total_amount,
  b.contact_name,
  b.contact_phone,
  b.contact_email,
  'Q.1, TP. Hồ Chí Minh',
  'Hóa đơn seed'
FROM bookings b
JOIN payments p ON p.booking_id = b.id AND p.transaction_ref = 'VNPAY-2026-0001'
WHERE b.booking_code = 'BK-2026-0001';

-- Reviews (mix of verified user reviews)
INSERT IGNORE INTO reviews (tour_id, user_id, reviewer_name, rating, comment, status)
SELECT t.id, u.id, u.full_name, 5,
       'Tour tổ chức ổn, lịch trình hợp lý, hướng dẫn viên nhiệt tình.',
       'visible'
FROM tours t
JOIN users u ON u.email = 'customer1@example.com'
WHERE t.code = 'VN-DN-HA-01';

INSERT IGNORE INTO reviews (tour_id, user_id, reviewer_name, rating, comment, status)
SELECT t.id, u.id, u.full_name, 4,
       'Khung cảnh đẹp, tuy nhiên di chuyển hơi nhiều. Tổng thể hài lòng.',
       'visible'
FROM tours t
JOIN users u ON u.email = 'customer3@example.com'
WHERE t.code = 'VN-HL-HP-02';
