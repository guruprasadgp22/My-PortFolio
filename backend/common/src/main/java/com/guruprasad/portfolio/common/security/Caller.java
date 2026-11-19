package com.guruprasad.portfolio.common.security;

import com.guruprasad.portfolio.common.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

/**
 * Who is calling, as established by the gateway. The gateway removes these headers from every incoming request
 * and sets them itself, so a visitor can't fake them.
 *   X-Admin-User  the signed-in admin, only after the gateway has checked the session with auth-service
 *   X-Client-Ip   the visitor's address, for rate limits and audit logs
 */
public final class Caller {

    public static final String ADMIN_HEADER = "X-Admin-User";
    public static final String IP_HEADER = "X-Client-Ip";

    private Caller() {
    }

    /** The signed-in admin's username; 401 if the request isn't from one (defence in depth behind the gateway). */
    public static String requireAdmin(HttpServletRequest request) {
        String user = request.getHeader(ADMIN_HEADER);
        if (user == null || user.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in");
        }
        return user;
    }

    public static String ip(HttpServletRequest request) {
        String ip = request.getHeader(IP_HEADER);
        return ip == null || ip.isBlank() ? "unknown" : ip;
    }
}
