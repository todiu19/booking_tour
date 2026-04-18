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

-- Compatibility fix: create hotels + itinerary tables when DB was initialized from old schema.
CREATE TABLE IF NOT EXISTS hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NULL,
    stars TINYINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
INSERT IGNORE INTO tours (code, name, description, duration_days, base_price, destination_list, status) VALUES
('VN-DN-HA-01', 'Đà Nẵng – Hội An 4N3Đ', 'Tham quan biển Mỹ Khê, phố cổ Hội An, Cầu Vàng Bà Nà Hills.', 4, 4590000.00, '["Đà Nẵng","Hội An"]', 'published'),
('VN-HL-HP-02', 'Hạ Long – Hải Phòng 3N2Đ', 'Du thuyền vịnh Hạ Long, hang Sửng Sốt, làng chài.', 3, 3290000.00, '["Hạ Long","Hải Phòng"]', 'published'),
('VN-SGN-MEK-03', 'Miền Tây sông nước 2N1Đ', 'Cần Thơ, chợ nổi Cái Răng, vườn trái cây.', 2, 1890000.00, '["Cần Thơ","Vĩnh Long"]', 'published'),
('VN-SAPA-04', 'Sapa – Fansipan 3N2Đ', 'Bản Cát Cát, đỉnh Fansipan, ruộng bậc thang Mường Hoa.', 3, 4190000.00, '["Sapa","Lào Cai"]', 'published'),
('VN-PQ-05', 'Phú Quốc nghỉ dưỡng 4N3Đ', 'Bãi Sao, VinWonders, nhà tù Phú Quốc, hoàng hôn Dinh Cậu.', 4, 5990000.00, '["Phú Quốc"]', 'published'),
('VN-HUE-DN-06', 'Huế – Đà Nẵng di sản 5N4Đ', 'Đại Nội, lăng Khải Định, sông Hương, Ngũ Hành Sơn.', 5, 5490000.00, '["Huế","Đà Nẵng"]', 'published');

UPDATE tours SET departure_date = '2026-05-10' WHERE code = 'VN-DN-HA-01';
UPDATE tours SET departure_date = '2026-06-14' WHERE code = 'VN-HL-HP-02';
UPDATE tours SET departure_date = '2026-05-03' WHERE code = 'VN-SGN-MEK-03';
UPDATE tours SET departure_date = '2026-05-22' WHERE code = 'VN-SAPA-04';
UPDATE tours SET departure_date = '2026-07-02' WHERE code = 'VN-PQ-05';
UPDATE tours SET departure_date = '2026-06-01' WHERE code = 'VN-HUE-DN-06';

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

-- Sample destinations (re-runnable; matches unique constraint)
INSERT IGNORE INTO destinations (name, province, country, image_url) VALUES
('Đà Nẵng', 'Đà Nẵng', 'Viet Nam', 'https://images.unsplash.com/photo-1528127269322-539801943592'),
('Hội An', 'Quảng Nam', 'Viet Nam', 'https://images.unsplash.com/photo-1526481280695-3c46925f49d5'),
('Bà Nà Hills', 'Đà Nẵng', 'Viet Nam', 'https://images.unsplash.com/photo-1548013146-72479768bada'),
('Hạ Long', 'Quảng Ninh', 'Viet Nam', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8'),
('Cát Bà', 'Hải Phòng', 'Viet Nam', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'),
('Cần Thơ', 'Cần Thơ', 'Viet Nam', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b'),
('Sapa', 'Lào Cai', 'Viet Nam', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'),
('Fansipan', 'Lào Cai', 'Viet Nam', 'https://images.unsplash.com/photo-1528127269322-539801943592'),
('Phú Quốc', 'Kiên Giang', 'Viet Nam', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'),
('Huế', 'Thừa Thiên Huế', 'Viet Nam', 'https://images.unsplash.com/photo-1472396961693-142e6e269027');

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

-- Sample hotels
INSERT IGNORE INTO hotels (id, name, address, stars) VALUES
(1, 'Da Nang Riverside Hotel', 'Đà Nẵng', 4),
(2, 'Hoi An Ancient House', 'Hội An', 4),
(3, 'Ha Long Bay Resort', 'Hạ Long', 5),
(4, 'Sapa Mountain View', 'Sapa', 4),
(5, 'Phu Quoc Beach Hotel', 'Phú Quốc', 5),
(6, 'Hue Imperial Hotel', 'Huế', 4);

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
