-- -- Seed roles and sample users.
-- -- Passwords are stored as BCrypt hashes, never plain text.

-- INSERT IGNORE INTO roles (name) VALUES ('customer');
-- INSERT IGNORE INTO roles (name) VALUES ('admin');

-- -- Admin sample account:
-- -- email: admin1@gmail.com
-- -- password: Admin@123
-- INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
-- SELECT
--     'Administrator',
--     'admin1@gmail.com',
--     '0900000001',
--     '$2y$10$ywAtckODPVvrf9ET.5Emy.ciqrq6am/8fYKwJ7uk2CUX5NuIPH4mq',
--     r.id,
--     'active'
-- FROM roles r
-- WHERE r.name = 'admin'
-- LIMIT 1;

-- UPDATE users u
-- INNER JOIN roles r ON r.name = 'admin'
-- SET u.role_id = r.id
-- WHERE u.email = 'admin1@gmail.com';

-- -- Customer sample accounts:
-- -- password for all sample customers: User@123
-- INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
-- SELECT
--     'Nguyen Van A',
--     'customer1@gmail.com',
--     '0900000002',
--     '$2y$10$24S61wVeYPAk3QCZ.r3X.eYoVM3XEyVzd1T7y3xla7eKHoQDJzZmm',
--     r.id,
--     'active'
-- FROM roles r
-- WHERE r.name = 'customer'
-- LIMIT 1;

-- INSERT IGNORE INTO users (full_name, email, phone, password_hash, role_id, status)
-- SELECT
--     'Tran Thi B',
--     'customer2@gmail.com',
--     '0900000003',
--     '$2y$10$24S61wVeYPAk3QCZ.r3X.eYoVM3XEyVzd1T7y3xla7eKHoQDJzZmm',
--     r.id,
--     'active'
-- FROM roles r
-- WHERE r.name = 'customer'
-- LIMIT 1;

-- -- Hotel types.
-- INSERT IGNORE INTO hotel_types (code, name) VALUES
-- ('resort', 'Resort'),
-- ('hotel_5_star', 'Khách sạn 5 sao'),
-- ('hotel_4_star', 'Khách sạn 4 sao'),
-- ('boutique', 'Boutique hotel'),
-- ('homestay', 'Homestay');

-- -- 20 destinations in Viet Nam.
-- INSERT IGNORE INTO destinations (name, province, country, image_url, description) VALUES
-- ('Vịnh Hạ Long', 'Quảng Ninh', 'Việt Nam', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi, hang động và làng chài trên vịnh.'),
-- ('Tràng An', 'Ninh Bình', 'Việt Nam', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80', 'Quần thể danh thắng sông nước, núi đá vôi và đền chùa cổ kính.'),
-- ('Sa Pa', 'Lào Cai', 'Việt Nam', 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80', 'Thị trấn vùng cao nổi tiếng với ruộng bậc thang, Fansipan và bản làng dân tộc.'),
-- ('Hà Giang', 'Hà Giang', 'Việt Nam', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'Cao nguyên đá, đèo Mã Pì Lèng và mùa hoa tam giác mạch đặc trưng miền cực Bắc.'),
-- ('Hội An', 'Quảng Nam', 'Việt Nam', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80', 'Phố cổ ven sông Hoài với nhà cổ, đèn lồng, ẩm thực và nhịp sống chậm rãi.'),
-- ('Đà Nẵng', 'Đà Nẵng', 'Việt Nam', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=80', 'Thành phố biển năng động, gần Bà Nà Hills, Sơn Trà và Ngũ Hành Sơn.'),
-- ('Huế', 'Thừa Thiên Huế', 'Việt Nam', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80', 'Cố đô với Đại Nội, lăng tẩm triều Nguyễn, chùa Thiên Mụ và ẩm thực cung đình.'),
-- ('Phong Nha - Kẻ Bàng', 'Quảng Bình', 'Việt Nam', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 'Vườn quốc gia có hệ thống hang động, sông ngầm và rừng nguyên sinh.'),
-- ('Đà Lạt', 'Lâm Đồng', 'Việt Nam', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Thành phố cao nguyên khí hậu mát mẻ, hồ Xuân Hương, rừng thông và vườn hoa.'),
-- ('Nha Trang', 'Khánh Hòa', 'Việt Nam', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', 'Thành phố biển có vịnh đẹp, đảo san hô, bùn khoáng và hải sản phong phú.'),
-- ('Mũi Né', 'Bình Thuận', 'Việt Nam', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 'Thiên đường biển với đồi cát bay, làng chài và các môn thể thao gió.'),
-- ('Phú Quốc', 'Kiên Giang', 'Việt Nam', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80', 'Đảo ngọc nổi tiếng với bãi biển, rừng quốc gia, làng chài và hoàng hôn đẹp.'),
-- ('Cần Thơ', 'Cần Thơ', 'Việt Nam', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', 'Trung tâm miền Tây với chợ nổi Cái Răng, miệt vườn và sông nước.'),
-- ('Châu Đốc', 'An Giang', 'Việt Nam', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', 'Vùng biên giới với núi Sam, rừng tràm Trà Sư và văn hóa đa sắc màu.'),
-- ('Côn Đảo', 'Bà Rịa - Vũng Tàu', 'Việt Nam', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80', 'Quần đảo yên bình với biển xanh, di tích lịch sử và hệ sinh thái biển.'),
-- ('Vũng Tàu', 'Bà Rịa - Vũng Tàu', 'Việt Nam', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Điểm nghỉ cuối tuần gần TP HCM với bãi Sau, hải sản và cung đường ven biển.'),
-- ('Mộc Châu', 'Sơn La', 'Việt Nam', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 'Cao nguyên chè, mùa hoa mận, thác Dải Yếm và bản làng Tây Bắc.'),
-- ('Mai Châu', 'Hòa Bình', 'Việt Nam', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'Thung lũng xanh với bản Lác, nhà sàn, đạp xe và văn hóa Thái.'),
-- ('Pù Luông', 'Thanh Hóa', 'Việt Nam', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 'Khu bảo tồn thiên nhiên có ruộng bậc thang, suối thác và bản làng yên tĩnh.'),
-- ('Quy Nhơn', 'Bình Định', 'Việt Nam', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', 'Thành phố biển miền Trung với Kỳ Co, Eo Gió, tháp Chăm và hải sản.');

-- -- 10 hotels.
-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'InterContinental Danang Sun Peninsula Resort', 'Bãi Bắc, bán đảo Sơn Trà', 'Sơn Trà, Đà Nẵng', 'Resort cao cấp nằm giữa rừng và biển, phù hợp nghỉ dưỡng sang trọng.', 8200000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'resort'
-- WHERE d.name = 'Đà Nẵng' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'InterContinental Danang Sun Peninsula Resort');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Azerai La Residence Hue', '5 Lê Lợi', 'Trung tâm Huế', 'Khách sạn boutique bên sông Hương, gần Đại Nội và phố đi bộ.', 4200000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'boutique'
-- WHERE d.name = 'Huế' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Azerai La Residence Hue');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Hotel de la Coupole Sapa', '1 Hoàng Liên', 'Trung tâm Sa Pa', 'Khách sạn 5 sao phong cách Đông Dương, thuận tiện đi Fansipan.', 3900000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'hotel_5_star'
-- WHERE d.name = 'Sa Pa' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Hotel de la Coupole Sapa');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Anantara Hoi An Resort', '1 Phạm Hồng Thái', 'Ven sông Thu Bồn, Hội An', 'Resort ven sông, đi bộ tới phố cổ và khu ẩm thực Hội An.', 5100000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'resort'
-- WHERE d.name = 'Hội An' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Anantara Hoi An Resort');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Meliá Vinpearl Nha Trang Empire', '44-46 Lê Thánh Tôn', 'Trung tâm Nha Trang', 'Khách sạn cao tầng gần biển, chợ đêm và quảng trường trung tâm.', 2100000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'hotel_5_star'
-- WHERE d.name = 'Nha Trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Meliá Vinpearl Nha Trang Empire');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Salinda Resort Phu Quoc Island', 'Cửa Lấp, Dương Tơ', 'Phú Quốc', 'Resort biển yên tĩnh, phù hợp cặp đôi và gia đình nghỉ dưỡng.', 4600000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'resort'
-- WHERE d.name = 'Phú Quốc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Salinda Resort Phu Quoc Island');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Victoria Can Tho Resort', 'Cái Khế', 'Bờ sông Hậu, Cần Thơ', 'Resort phong cách thuộc địa bên sông Hậu, thuận tiện đi chợ nổi.', 2500000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'resort'
-- WHERE d.name = 'Cần Thơ' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Victoria Can Tho Resort');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Muong Thanh Luxury Quang Ninh', 'Hạ Long Marina', 'Bãi Cháy, Hạ Long', 'Khách sạn gần bến du thuyền, thuận tiện tham quan vịnh Hạ Long.', 1800000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'hotel_4_star'
-- WHERE d.name = 'Vịnh Hạ Long' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Muong Thanh Luxury Quang Ninh');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Ladalat Hotel', '106A Mai Anh Đào', 'Thung lũng Tình Yêu, Đà Lạt', 'Khách sạn 5 sao gần khu du lịch, không gian nghỉ dưỡng mát mẻ.', 2300000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'hotel_5_star'
-- WHERE d.name = 'Đà Lạt' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Ladalat Hotel');

-- INSERT INTO hotels (name, address, location, description, base_price, room_capacity, status, destination_id, hotel_type_id)
-- SELECT 'Pù Luông Retreat', 'Bản Đôn', 'Pù Luông, Thanh Hóa', 'Khu nghỉ sinh thái nhìn ra ruộng bậc thang, phù hợp trekking nhẹ.', 1700000, 2, 'active', d.id, ht.id
-- FROM destinations d JOIN hotel_types ht ON ht.code = 'homestay'
-- WHERE d.name = 'Pù Luông' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Pù Luông Retreat');
-- INSERT INTO hotels
-- (
--     name,
--     address,
--     location,
--     description,
--     base_price,
--     room_capacity,
--     status,
--     destination_id,
--     hotel_type_id
-- )
-- VALUES

-- (
--     'Ninh Binh Hidden Charm Hotel',
--     'No 9 Tam Coc Road',
--     'Ninh Bình',
--     'Khách sạn gần Tam Cốc và Tràng An, phù hợp khách du lịch nghỉ dưỡng.',
--     1900000,
--     2,
--     'active',
--     2,
--     2
-- ),

-- (
--     'Pao''s Leisure Ha Giang',
--     'Lý Thường Kiệt',
--     'Hà Giang',
--     'Resort cao cấp với tầm nhìn núi non Hà Giang.',
--     2200000,
--     2,
--     'active',
--     4,
--     2
-- ),

-- (
--     'Sai Gon Phong Nha Hotel',
--     '20 Quách Xuân Kỳ',
--     'Phong Nha - Quảng Bình',
--     'Khách sạn ven sông Son, gần động Phong Nha.',
--     1800000,
--     2,
--     'active',
--     8,
--     2
-- ),

-- (
--     'Centara Mirage Resort Mui Ne',
--     'Huỳnh Thúc Kháng',
--     'Mũi Né - Bình Thuận',
--     'Resort biển cao cấp với nhiều tiện ích nghỉ dưỡng.',
--     3500000,
--     2,
--     'active',
--     11,
--     2
-- ),

-- (
--     'Victoria Chau Doc Hotel',
--     '1 Lê Lợi',
--     'Châu Đốc - An Giang',
--     'Khách sạn ven sông Hậu, thuận tiện tham quan Châu Đốc.',
--     2400000,
--     2,
--     'active',
--     14,
--     2
-- );
-- -- Hotel images, 3 images each.
-- INSERT INTO hotel_images (hotel_id, image_url, display_order)
-- SELECT h.id, x.image_url, x.display_order
-- FROM hotels h
-- JOIN (
--     SELECT 'InterContinental Danang Sun Peninsula Resort' hotel_name, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' image_url, 1 display_order UNION ALL
--     SELECT 'InterContinental Danang Sun Peninsula Resort', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'InterContinental Danang Sun Peninsula Resort', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Azerai La Residence Hue', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Azerai La Residence Hue', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Azerai La Residence Hue', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Hotel de la Coupole Sapa', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Hotel de la Coupole Sapa', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Hotel de la Coupole Sapa', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Anantara Hoi An Resort', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Anantara Hoi An Resort', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Anantara Hoi An Resort', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Meliá Vinpearl Nha Trang Empire', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Meliá Vinpearl Nha Trang Empire', 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Meliá Vinpearl Nha Trang Empire', 'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Salinda Resort Phu Quoc Island', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Salinda Resort Phu Quoc Island', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Salinda Resort Phu Quoc Island', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Victoria Can Tho Resort', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Victoria Can Tho Resort', 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Victoria Can Tho Resort', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Muong Thanh Luxury Quang Ninh', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Muong Thanh Luxury Quang Ninh', 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Muong Thanh Luxury Quang Ninh', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Ladalat Hotel', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Ladalat Hotel', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Ladalat Hotel', 'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'Pù Luông Retreat', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'Pù Luông Retreat', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'Pù Luông Retreat', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 3
-- ) x ON x.hotel_name = h.name
-- WHERE NOT EXISTS (
--     SELECT 1 FROM hotel_images hi WHERE hi.hotel_id = h.id AND hi.image_url = x.image_url
-- );

-- -- 10 tours.
-- INSERT IGNORE INTO tours (code, name, description, duration_days, base_price, destination_list, departure_point, status) VALUES
-- ('VN-HN-HLG-3D', 'Hà Nội - Vịnh Hạ Long du thuyền 5 sao', 'Khám phá vịnh Hạ Long bằng du thuyền, tham quan hang Sửng Sốt, đảo Titop và trải nghiệm kayak.', 3, 5890000, JSON_ARRAY('Vịnh Hạ Long'), 'Hà Nội', 'published'),
-- ('VN-HN-NB-2D', 'Hà Nội - Tràng An - Bái Đính - Hang Múa', 'Hành trình cuối tuần tới Ninh Bình, ngồi thuyền Tràng An và ngắm toàn cảnh từ Hang Múa.', 2, 2690000, JSON_ARRAY('Tràng An'), 'Hà Nội', 'published'),
-- ('VN-HN-SP-4D', 'Hà Nội - Sa Pa - Fansipan - Bản Cát Cát', 'Tour vùng cao Sa Pa với Fansipan, bản Cát Cát, chợ địa phương và ruộng bậc thang.', 4, 6490000, JSON_ARRAY('Sa Pa'), 'Hà Nội', 'published'),
-- ('VN-HN-HG-4D', 'Hà Nội - Hà Giang - Đồng Văn - Mã Pì Lèng', 'Cung đường cao nguyên đá, dinh họ Vương, phố cổ Đồng Văn và đèo Mã Pì Lèng.', 4, 5790000, JSON_ARRAY('Hà Giang'), 'Hà Nội', 'published'),
-- ('VN-DN-HA-HUE-5D', 'Đà Nẵng - Hội An - Huế di sản miền Trung', 'Kết hợp biển Đà Nẵng, phố cổ Hội An, Đại Nội Huế và ẩm thực miền Trung.', 5, 8990000, JSON_ARRAY('Đà Nẵng', 'Hội An', 'Huế'), 'Đà Nẵng', 'published'),
-- ('VN-DN-PN-4D', 'Đà Nẵng - Phong Nha - Thiên Đường', 'Từ Đà Nẵng đi Quảng Bình, khám phá động Phong Nha, động Thiên Đường và sông Son.', 4, 7290000, JSON_ARRAY('Đà Nẵng', 'Phong Nha - Kẻ Bàng'), 'Đà Nẵng', 'published'),
-- ('VN-HCM-DL-3D', 'TP HCM - Đà Lạt nghỉ dưỡng cao nguyên', 'Không khí mát lành, vườn hoa, thác Datanla, cà phê săn mây và chợ đêm Đà Lạt.', 3, 4590000, JSON_ARRAY('Đà Lạt'), 'TP HCM', 'published'),
-- ('VN-HCM-NT-MN-5D', 'TP HCM - Nha Trang - Mũi Né biển xanh cát trắng', 'Hành trình ven biển Nam Trung Bộ với đảo Nha Trang, đồi cát Mũi Né và hải sản.', 5, 8190000, JSON_ARRAY('Nha Trang', 'Mũi Né'), 'TP HCM', 'published'),
-- ('VN-HCM-PQ-4D', 'TP HCM - Phú Quốc đảo ngọc', 'Nghỉ dưỡng Phú Quốc, check-in hoàng hôn, Nam đảo, cáp treo Hòn Thơm và chợ đêm.', 4, 7790000, JSON_ARRAY('Phú Quốc'), 'TP HCM', 'published'),
-- ('VN-HCM-MT-4D', 'TP HCM - Cần Thơ - Châu Đốc miền Tây', 'Trải nghiệm chợ nổi Cái Răng, vườn trái cây, rừng tràm Trà Sư và văn hóa sông nước.', 4, 5390000, JSON_ARRAY('Cần Thơ', 'Châu Đốc'), 'TP HCM', 'published');

-- -- Tour destinations.
-- INSERT IGNORE INTO tour_destinations (tour_id, destination_id, day_number)
-- SELECT t.id, d.id, x.day_number
-- FROM (
--     SELECT 'VN-HN-HLG-3D' code, 'Vịnh Hạ Long' destination_name, 1 day_number UNION ALL
--     SELECT 'VN-HN-NB-2D', 'Tràng An', 1 UNION ALL
--     SELECT 'VN-HN-SP-4D', 'Sa Pa', 1 UNION ALL
--     SELECT 'VN-HN-HG-4D', 'Hà Giang', 1 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'Đà Nẵng', 1 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'Hội An', 2 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'Huế', 4 UNION ALL
--     SELECT 'VN-DN-PN-4D', 'Đà Nẵng', 1 UNION ALL
--     SELECT 'VN-DN-PN-4D', 'Phong Nha - Kẻ Bàng', 2 UNION ALL
--     SELECT 'VN-HCM-DL-3D', 'Đà Lạt', 1 UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', 'Nha Trang', 1 UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', 'Mũi Né', 4 UNION ALL
--     SELECT 'VN-HCM-PQ-4D', 'Phú Quốc', 1 UNION ALL
--     SELECT 'VN-HCM-MT-4D', 'Cần Thơ', 1 UNION ALL
--     SELECT 'VN-HCM-MT-4D', 'Châu Đốc', 3
-- ) x
-- JOIN tours t ON t.code = x.code
-- JOIN destinations d ON d.name = x.destination_name;

-- -- Tour departures, future dates.
-- INSERT IGNORE INTO tour_departures (tour_id, departure_date)
-- SELECT t.id, x.departure_date
-- FROM (
--     SELECT 'VN-HN-HLG-3D' code, DATE '2026-07-05' departure_date UNION ALL
--     SELECT 'VN-HN-HLG-3D', DATE '2026-07-19' UNION ALL
--     SELECT 'VN-HN-HLG-3D', DATE '2026-08-09' UNION ALL
--     SELECT 'VN-HN-NB-2D', DATE '2026-07-11' UNION ALL
--     SELECT 'VN-HN-NB-2D', DATE '2026-08-01' UNION ALL
--     SELECT 'VN-HN-SP-4D', DATE '2026-07-10' UNION ALL
--     SELECT 'VN-HN-SP-4D', DATE '2026-08-14' UNION ALL
--     SELECT 'VN-HN-HG-4D', DATE '2026-09-04' UNION ALL
--     SELECT 'VN-HN-HG-4D', DATE '2026-10-16' UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', DATE '2026-07-18' UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', DATE '2026-08-22' UNION ALL
--     SELECT 'VN-DN-PN-4D', DATE '2026-07-24' UNION ALL
--     SELECT 'VN-DN-PN-4D', DATE '2026-09-18' UNION ALL
--     SELECT 'VN-HCM-DL-3D', DATE '2026-07-12' UNION ALL
--     SELECT 'VN-HCM-DL-3D', DATE '2026-08-02' UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', DATE '2026-07-26' UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', DATE '2026-08-30' UNION ALL
--     SELECT 'VN-HCM-PQ-4D', DATE '2026-07-17' UNION ALL
--     SELECT 'VN-HCM-PQ-4D', DATE '2026-09-11' UNION ALL
--     SELECT 'VN-HCM-MT-4D', DATE '2026-07-31' UNION ALL
--     SELECT 'VN-HCM-MT-4D', DATE '2026-08-28'
-- ) x
-- JOIN tours t ON t.code = x.code;

-- -- Tour images, 3 images each.
-- INSERT IGNORE INTO tour_images (tour_id, image_url, display_order)
-- SELECT t.id, x.image_url, x.display_order
-- FROM (
--     SELECT 'VN-HN-HLG-3D' code, 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' image_url, 1 display_order UNION ALL
--     SELECT 'VN-HN-HLG-3D', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HN-HLG-3D', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HN-NB-2D', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HN-NB-2D', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HN-NB-2D', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HN-SP-4D', 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HN-SP-4D', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HN-SP-4D', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HN-HG-4D', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HN-HG-4D', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HN-HG-4D', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-DN-HA-HUE-5D', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-DN-PN-4D', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-DN-PN-4D', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-DN-PN-4D', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HCM-DL-3D', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HCM-DL-3D', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HCM-DL-3D', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HCM-NT-MN-5D', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HCM-PQ-4D', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HCM-PQ-4D', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HCM-PQ-4D', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', 3 UNION ALL
--     SELECT 'VN-HCM-MT-4D', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', 1 UNION ALL
--     SELECT 'VN-HCM-MT-4D', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', 2 UNION ALL
--     SELECT 'VN-HCM-MT-4D', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 3
-- ) x
-- JOIN tours t ON t.code = x.code;
-- INSERT INTO hotel_images
-- (hotel_id, image_url, display_order)
-- VALUES

-- -- Ninh Bình
-- (11,
-- 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
-- 1),
-- (11,
-- 'https://images.unsplash.com/photo-1582719508461-905c673771fd',
-- 0),

-- -- Hà Giang
-- (12,
-- 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
-- 1),
-- (12,
-- 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
-- 0),

-- -- Phong Nha
-- (13,
-- 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8',
-- 1),
-- (13,
-- 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
-- 0),

-- -- Mũi Né
-- (14,
-- 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
-- 1),
-- (14,
-- 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
-- 0),

-- -- Châu Đốc
-- (15,
-- 'https://images.unsplash.com/photo-1455587734955-081b22074882',
-- 1),
-- (15,
-- 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
-- 0);

-- INSERT INTO tour_itineraries (tour_id, day_number, title, description) VALUES

-- (1,1,'Khởi hành Hà Nội - Hạ Long','Di chuyển từ Hà Nội đến Hạ Long, nhận phòng khách sạn.'),
-- (1,2,'Khám phá Vịnh Hạ Long','Tham quan hang Sửng Sốt, đảo Titop và chèo kayak.'),
-- (1,3,'Hạ Long - Hà Nội','Tự do tham quan và trở về Hà Nội.'),

-- (2,1,'Tràng An - Bái Đính','Tham quan Tràng An và chùa Bái Đính.'),
-- (2,2,'Hang Múa','Leo Hang Múa và trở về Hà Nội.'),

-- (3,1,'Hà Nội - Sa Pa','Di chuyển đến Sa Pa, nhận phòng.'),
-- (3,2,'Fansipan','Chinh phục Fansipan bằng cáp treo.'),
-- (3,3,'Bản Cát Cát','Khám phá văn hóa địa phương.'),
-- (3,4,'Sa Pa - Hà Nội','Mua sắm đặc sản và trở về.'),

-- (4,1,'Hà Nội - Hà Giang','Khởi hành đi Hà Giang.'),
-- (4,2,'Quản Bạ - Yên Minh','Tham quan cao nguyên đá.'),
-- (4,3,'Đồng Văn - Mã Pì Lèng','Khám phá Mã Pì Lèng.'),
-- (4,4,'Hà Giang - Hà Nội','Kết thúc hành trình.'),

-- (5,1,'Đà Nẵng','Biển Mỹ Khê và Sơn Trà.'),
-- (5,2,'Hội An','Tham quan phố cổ Hội An.'),
-- (5,3,'Bà Nà Hills','Cầu Vàng và Fantasy Park.'),
-- (5,4,'Huế','Đại Nội và chùa Thiên Mụ.'),
-- (5,5,'Huế - Đà Nẵng','Kết thúc tour.'),

-- (6,1,'Đà Nẵng - Quảng Bình','Khởi hành đi Phong Nha.'),
-- (6,2,'Động Phong Nha','Khám phá động Phong Nha.'),
-- (6,3,'Động Thiên Đường','Tham quan động Thiên Đường.'),
-- (6,4,'Trở về Đà Nẵng','Kết thúc tour.'),

-- (7,1,'TP HCM - Đà Lạt','Di chuyển đến Đà Lạt.'),
-- (7,2,'Đà Lạt','Langbiang, hồ Xuân Hương.'),
-- (7,3,'Đà Lạt - TP HCM','Mua sắm và trở về.'),

-- (8,1,'TP HCM - Nha Trang','Khởi hành đi Nha Trang.'),
-- (8,2,'Tour đảo','Khám phá Hòn Mun, Hòn Tằm.'),
-- (8,3,'VinWonders','Vui chơi giải trí.'),
-- (8,4,'Mũi Né','Đồi cát bay và làng chài.'),
-- (8,5,'Mũi Né - TP HCM','Kết thúc tour.'),

-- (9,1,'TP HCM - Phú Quốc','Bay đến Phú Quốc.'),
-- (9,2,'Nam Đảo','Khám phá Nam Đảo.'),
-- (9,3,'Hòn Thơm','Trải nghiệm cáp treo.'),
-- (9,4,'Phú Quốc - TP HCM','Kết thúc tour.'),

-- (10,1,'Cần Thơ','Chợ nổi Cái Răng.'),
-- (10,2,'Miệt vườn','Trải nghiệm vườn trái cây.'),
-- (10,3,'Châu Đốc','Miếu Bà Chúa Xứ và Trà Sư.'),
-- (10,4,'TP HCM','Kết thúc hành trình.');


-- INSERT INTO tour_itinerary_hotels
-- (itinerary_id, hotel_id, night_count)
-- VALUES

-- -- Tour 1: Hạ Long 3N2Đ
-- (1, 8, 1),
-- (2, 8, 1),

-- -- Tour 2: Ninh Bình 2N1Đ
-- (4, 11, 1),

-- -- Tour 3: Sa Pa 4N3Đ
-- (6, 3, 1),
-- (7, 3, 1),
-- (8, 3, 1),

-- -- Tour 4: Hà Giang 4N3Đ
-- (10, 12, 1),
-- (11, 12, 1),
-- (12, 12, 1),

-- -- Tour 5: Đà Nẵng - Hội An - Huế 5N4Đ
-- (14, 1, 1),
-- (15, 1, 1),
-- (16, 4, 1),
-- (17, 2, 1),

-- -- Tour 6: Đà Nẵng - Phong Nha 4N3Đ
-- (19, 1, 1),
-- (20, 13, 1),
-- (21, 13, 1),

-- -- Tour 7: Đà Lạt 3N2Đ
-- (23, 9, 1),
-- (24, 9, 1),

-- -- Tour 8: Nha Trang - Mũi Né 5N4Đ
-- (26, 5, 1),
-- (27, 5, 1),
-- (28, 5, 1),
-- (29, 14, 1),

-- -- Tour 9: Phú Quốc 4N3Đ
-- (31, 6, 1),
-- (32, 6, 1),
-- (33, 6, 1),

-- -- Tour 10: Cần Thơ - Châu Đốc 4N3Đ
-- (35, 7, 1),
-- (36, 7, 1),
-- (37, 15, 1);

select 1;