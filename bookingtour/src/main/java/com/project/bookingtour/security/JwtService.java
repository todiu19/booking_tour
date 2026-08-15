package com.project.bookingtour.security;
// xử lý JWT: tạo token, xác thực token, trích xuất thông tin từ token
import com.project.bookingtour.config.JwtProperties;
import com.project.bookingtour.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    public String generateToken(User user) {
        long exp = jwtProperties.expirationMs();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + exp);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey())
                .compact();
    }

    // kiểm tra tính hợp lệ của token: có thể parse được và chưa hết hạn
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // trích xuất userId từ token (lấy sub claim và chuyển sang long)
    public long extractUserId(String token) {
        String sub = parseClaims(token).getSubject();
        return Long.parseLong(sub);
    }

    // parse token để lấy claims, nếu token không hợp lệ sẽ ném exception và được isValid() bắt để trả về false
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // tạo SecretKey từ chuỗi bí mật trong cấu hình, đảm bảo độ dài tối thiểu 32 bytes để đảm bảo an toàn khi sử dụng HMAC SHA-256
    private SecretKey signingKey() {
        byte[] bytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes (UTF-8)");
        }
        return Keys.hmacShaKeyFor(bytes);
    }
}
