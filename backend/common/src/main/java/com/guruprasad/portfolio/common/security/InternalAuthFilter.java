package com.guruprasad.portfolio.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Every service sits on a private network, but if one were ever reached directly (a misconfigured port, another
 * container), it still only answers requests carrying the shared internal token, which the gateway and the
 * services add and nobody outside knows. Anything else gets a plain 404, so a scan learns nothing.
 * The health check stays open for Docker.
 */
public class InternalAuthFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Internal-Token";

    private final byte[] token;

    public InternalAuthFilter(String token) {
        this.token = token.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "/actuator/health".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String got = request.getHeader(HEADER);
        if (got == null || !MessageDigest.isEqual(token, got.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Not found\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
