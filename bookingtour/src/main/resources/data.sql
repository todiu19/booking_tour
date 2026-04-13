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
INSERT IGNORE INTO tours (code, name, description, duration_days, departure_location, base_price, destination_list, status) VALUES
('VN-DN-HA-01', 'Đà Nẵng – Hội An 4N3Đ', 'Tham quan biển Mỹ Khê, phố cổ Hội An, Cầu Vàng Bà Nà Hills.', 4, 'TP. Hồ Chí Minh', 4590000.00, '["Đà Nẵng","Hội An"]', 'published'),
('VN-HL-HP-02', 'Hạ Long – Hải Phòng 3N2Đ', 'Du thuyền vịnh Hạ Long, hang Sửng Sốt, làng chài.', 3, 'Hà Nội', 3290000.00, '["Hạ Long","Hải Phòng"]', 'published'),
('VN-SGN-MEK-03', 'Miền Tây sông nước 2N1Đ', 'Cần Thơ, chợ nổi Cái Răng, vườn trái cây.', 2, 'TP. Hồ Chí Minh', 1890000.00, '["Cần Thơ","Vĩnh Long"]', 'published'),
('VN-SAPA-04', 'Sapa – Fansipan 3N2Đ', 'Bản Cát Cát, đỉnh Fansipan, ruộng bậc thang Mường Hoa.', 3, 'Hà Nội', 4190000.00, '["Sapa","Lào Cai"]', 'published'),
('VN-PQ-05', 'Phú Quốc nghỉ dưỡng 4N3Đ', 'Bãi Sao, VinWonders, nhà tù Phú Quốc, hoàng hôn Dinh Cậu.', 4, 'TP. Hồ Chí Minh', 5990000.00, '["Phú Quốc"]', 'published'),
('VN-HUE-DN-06', 'Huế – Đà Nẵng di sản 5N4Đ', 'Đại Nội, lăng Khải Định, sông Hương, Ngũ Hành Sơn.', 5, 'Hà Nội', 5490000.00, '["Huế","Đà Nẵng"]', 'published');

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
