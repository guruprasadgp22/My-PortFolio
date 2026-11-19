package com.guruprasad.portfolio.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

/**
 * The session cookie: a JWT signed with HS256 (SESSION_SECRET) holding the session id, user and password version.
 * The gateway checks the signature and expiry, then asks auth-service whether the session still exists.
 */
@Component
public class SessionTokens {

    public static final String COOKIE = "gp_admin";
    public static final String ISSUER = "portfolio-auth";
    public static final String AUDIENCE = "portfolio-admin";
    public static final Duration LIFETIME = Duration.ofHours(12);

    private final SecretKey key;

    public SessionTokens(@Value("${portfolio.session-secret:}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("SESSION_SECRET must be set to at least 32 random characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issue(String sessionId, String user, int version, Date expires) {
        return Jwts.builder()
                .id(sessionId)
                .subject(user)
                .claim("v", version)
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .issuedAt(new Date())
                .expiration(expires)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** The claims of a valid token, or null (bad signature, expired, wrong issuer or audience). */
    public Claims read(String token) {
        if (token == null || token.isBlank() || token.length() > 2048) {
            return null;
        }
        try {
            return Jwts.parser().verifyWith(key).requireIssuer(ISSUER).requireAudience(AUDIENCE).build()
                    .parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public static String cookie(String token) {
        return COOKIE + "=" + token + "; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + LIFETIME.toSeconds();
    }

    public static String clearedCookie() {
        return COOKIE + "=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
    }
}
