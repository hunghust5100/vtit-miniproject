package com.vdt.vtit.security.jwt;

import com.vdt.vtit.auth.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtils {
    private final JwtProp jwtProp;
    private SecretKey key;

    @PostConstruct
    private void init() {
        this.key = Keys.hmacShaKeyFor(jwtProp.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(AppUser user) {
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getUser().getId())
                .claim("role", user.getUser().getRole())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProp.expiration()))
                .signWith(key)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromToken(String token) {

        return extractAllClaims(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    public String getRoleFromToken(String token) {
        return extractAllClaims((token)).get("role", String.class);
    }

    private boolean isTokenExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !isTokenExpired(claims);
        } catch (JwtException | IllegalArgumentException e) {
            log.error("JWT validation failed: {}", e.getMessage());
        }
        return false;
    }

}
