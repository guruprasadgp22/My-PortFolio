package com.guruprasad.portfolio.gateway.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Runs first on every request, before any routing:
 *   1. allow-list (AccessRules): anything not listed, or with encoded slashes or dot segments → 404
 *   2. removes X-Admin-User / X-Internal-Token / X-Client-Ip sent by the visitor, so they can't be faked
 *   3. rate limit per address (RateLimiter) → 429
 *   4. body size: a body must declare its length, within the route's limit → 411 / 413
 *   5. writes (POST/PUT/DELETE) must come from the site itself: Origin on the allow-list, Sec-Fetch-Site
 *      same-origin, and for admin writes the X-GP-Admin header, which another site can't send → 403
 *   6. admin routes need a valid session (SessionVerifier) → 401
 *   7. adds the internal token, the visitor's address and, for admins, the username for the services
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GatewaySecurityFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(GatewaySecurityFilter.class);
    private static final Pattern SUSPICIOUS = Pattern.compile("(?i)%2f|%5c|%2e|%00|\\\\|/\\.|//");
    private static final List<String> TRUSTED_ONLY = List.of("X-Admin-User", "X-Internal-Token", "X-Client-Ip");

    private final RateLimiter limits;
    private final SessionVerifier sessions;
    private final String internalToken;
    private final Pattern allowedOrigins;
    private final String clientIpHeader;

    public GatewaySecurityFilter(RateLimiter limits, SessionVerifier sessions,
                                 @Value("${portfolio.internal-token:}") String internalToken,
                                 @Value("${portfolio.allowed-origins}") String allowedOrigins,
                                 @Value("${portfolio.client-ip-header:}") String clientIpHeader) {
        this.limits = limits;
        this.sessions = sessions;
        this.internalToken = internalToken;
        this.allowedOrigins = Pattern.compile(allowedOrigins);
        this.clientIpHeader = clientIpHeader;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().pathWithinApplication().value();
        HttpMethod method = request.getMethod();

        if (path.equals("/actuator/health") && method == HttpMethod.GET) {
            return chain.filter(exchange);
        }

        // encoded slashes, backslashes and dot segments have no place in this site's URLs: refuse them outright
        String raw = request.getURI().getRawPath();
        if (SUSPICIOUS.matcher(raw).find()) {
            return reject(exchange, HttpStatus.NOT_FOUND, "Not found");
        }

        AccessRules.Match match = AccessRules.resolve(method, path);
        if (match.access() == AccessRules.Access.NOT_FOUND) {
            return reject(exchange, HttpStatus.NOT_FOUND, "Not found");
        }

        String ip = clientIp(request);
        long wait = limits.check(match.kind(), ip);
        if (wait > 0) {
            log.warn("Rate limited: {} {} ip={}", method, path, ip);
            exchange.getResponse().getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(wait));
            return reject(exchange, HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again in a few minutes.");
        }

        boolean write = method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.DELETE;
        long length = request.getHeaders().getContentLength();
        if (match.maxBody() == 0 && length > 0) {
            return reject(exchange, HttpStatus.PAYLOAD_TOO_LARGE, "This request doesn't take a body");
        }
        if (match.maxBody() > 0 && (method == HttpMethod.POST || method == HttpMethod.PUT)) {
            if (length < 0) {
                return reject(exchange, HttpStatus.LENGTH_REQUIRED, "Send the body with its length");
            }
            if (length > match.maxBody()) {
                return reject(exchange, HttpStatus.PAYLOAD_TOO_LARGE, "That's too much data for one request");
            }
        }

        if (write && !fromThisSite(request, path.startsWith("/api/admin/"))) {
            log.warn("Cross-site write refused: {} {} origin={} ip={}", method, path, request.getHeaders().getOrigin(), ip);
            return reject(exchange, HttpStatus.FORBIDDEN, "Forbidden");
        }

        HttpCookie cookie = request.getCookies().getFirst(SessionVerifier.COOKIE);
        String token = cookie == null ? null : cookie.getValue();
        if (path.equals("/api/admin/logout")) {
            sessions.forget(token);
        }

        if (match.access() == AccessRules.Access.PUBLIC) {
            return chain.filter(forward(exchange, ip, null));
        }
        return sessions.user(token)
                .map(user -> forward(exchange, ip, user))
                .flatMap(ex -> chain.filter(ex).then(Mono.just(true)))
                .switchIfEmpty(Mono.defer(() -> reject(exchange, HttpStatus.UNAUTHORIZED, "Please sign in").then(Mono.just(false))))
                .then();
    }

    private boolean fromThisSite(ServerHttpRequest request, boolean admin) {
        HttpHeaders h = request.getHeaders();
        String origin = h.getOrigin();
        if (origin != null && !allowedOrigins.matcher(origin).matches()) {
            return false;
        }
        String site = h.getFirst("Sec-Fetch-Site");
        if (site != null && !site.equals("same-origin") && !site.equals("none")) {
            return false;
        }
        return !admin || "1".equals(h.getFirst("X-GP-Admin"));
    }

    private ServerWebExchange forward(ServerWebExchange exchange, String ip, String admin) {
        ServerHttpRequest mutated = exchange.getRequest().mutate().headers(h -> {
            TRUSTED_ONLY.forEach(h::remove);
            h.set("X-Internal-Token", internalToken);
            h.set("X-Client-Ip", ip);
            if (admin != null) {
                h.set("X-Admin-User", admin);
            }
        }).build();
        return exchange.mutate().request(mutated).build();
    }

    /**
     * The visitor's address: the header the front proxy sets (Netlify: X-Nf-Client-Connection-Ip), else the last
     * X-Forwarded-For entry (added by the proxy in front of the gateway, not by the visitor), else the socket.
     */
    private String clientIp(ServerHttpRequest request) {
        HttpHeaders h = request.getHeaders();
        if (clientIpHeader != null && !clientIpHeader.isBlank()) {
            String v = h.getFirst(clientIpHeader);
            if (v != null && !v.isBlank() && v.length() < 64) {
                return v.trim();
            }
        }
        String xff = h.getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            String last = parts[parts.length - 1].trim();
            if (!last.isEmpty() && last.length() < 64) {
                return last;
            }
        }
        InetSocketAddress remote = request.getRemoteAddress();
        return remote == null || remote.getAddress() == null ? "unknown" : remote.getAddress().getHostAddress();
    }

    static Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.empty();
        }
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("no-store");
        byte[] body = ("{\"error\":\"" + message.replace("\"", "'") + "\"}").getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(body);
        return response.writeWith(Mono.just(buffer));
    }
}
