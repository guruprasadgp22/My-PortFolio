package com.guruprasad.portfolio.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Checks the admin session cookie in two steps:
 *   1. the JWT itself: HS256 signature, expiry, issuer and audience (a forged or edited cookie fails here);
 *   2. auth-service: the session record still exists and matches the current password (signed out, password
 *      changed or record deleted all fail here). Step 2's answer is remembered for 15 seconds.
 * Any doubt, including auth-service being unreachable, means "not signed in".
 */
@Component
public class SessionVerifier {

    public static final String COOKIE = "gp_admin";
    private static final Logger log = LoggerFactory.getLogger(SessionVerifier.class);
    private static final Duration REMEMBER = Duration.ofSeconds(15);

    private record Remembered(boolean valid, long at) {
    }

    private final SecretKey key;
    private final WebClient auth;
    private final String internalToken;
    private final Map<String, Remembered> recent = new ConcurrentHashMap<>();

    public SessionVerifier(@Value("${portfolio.session-secret:}") String secret,
                           @Value("${portfolio.internal-token:}") String internalToken,
                           WebClient.Builder loadBalanced) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("SESSION_SECRET must be set to at least 32 random characters");
        }
        if (internalToken == null || internalToken.length() < 32) {
            throw new IllegalStateException("INTERNAL_TOKEN must be set to at least 32 random characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.internalToken = internalToken;
        this.auth = loadBalanced.baseUrl("http://auth-service").build();
    }

    public Claims claims(String token) {
        if (token == null || token.isBlank() || token.length() > 2048) {
            return null;
        }
        try {
            return Jwts.parser().verifyWith(key).requireIssuer("portfolio-auth").requireAudience("portfolio-admin").build()
                    .parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    /** The signed-in username, or empty. */
    public Mono<String> user(String token) {
        Claims c = claims(token);
        if (c == null || c.getId() == null || c.getSubject() == null || !(c.get("v") instanceof Number v)) {
            return Mono.empty();
        }
        String sid = c.getId();
        Remembered r = recent.get(sid);
        if (r != null && System.currentTimeMillis() - r.at() < REMEMBER.toMillis()) {
            return r.valid() ? Mono.just(c.getSubject()) : Mono.empty();
        }
        return auth.post().uri("/api/internal/sessions/verify")
                .header("X-Internal-Token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("sid", sid, "user", c.getSubject(), "version", v.intValue()))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(4))
                .map(body -> Boolean.TRUE.equals(body.get("valid")))
                .onErrorResume(e -> {
                    log.warn("Session check failed, treating as signed out: {}", e.getMessage());
                    return Mono.just(false);
                })
                .flatMap(valid -> {
                    recent.put(sid, new Remembered(valid, System.currentTimeMillis()));
                    if (recent.size() > 1000) {
                        recent.clear();
                    }
                    return valid ? Mono.just(c.getSubject()) : Mono.empty();
                });
    }

    /** Called on sign-out, so the remembered answer doesn't keep the session alive for another 15 seconds. */
    public void forget(String token) {
        Claims c = claims(token);
        if (c != null && c.getId() != null) {
            recent.remove(c.getId());
        }
    }
}
