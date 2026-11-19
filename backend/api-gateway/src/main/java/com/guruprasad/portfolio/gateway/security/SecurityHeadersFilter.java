package com.guruprasad.portfolio.gateway.security;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Safe defaults on every response: no MIME sniffing, no framing, HTTPS only, no referrer leaks, no browser
 * features, and nothing from the admin API is ever cached. Version-revealing headers are removed.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class SecurityHeadersFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        exchange.getResponse().beforeCommit(() -> {
            HttpHeaders h = exchange.getResponse().getHeaders();
            h.set("X-Content-Type-Options", "nosniff");
            h.set("X-Frame-Options", "DENY");
            h.set("Referrer-Policy", "strict-origin-when-cross-origin");
            h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
            h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
            h.set("Cross-Origin-Resource-Policy", "same-site");
            h.set("X-Permitted-Cross-Domain-Policies", "none");
            if (!h.containsKey("Content-Security-Policy")) {
                h.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
            }
            if (path.startsWith("/api/admin")) {
                h.setCacheControl("no-store");
                h.set("Pragma", "no-cache");
            }
            h.remove("Server");
            h.remove("X-Powered-By");
            h.remove("X-Application-Context");
            return Mono.empty();
        });
        return chain.filter(exchange);
    }
}
