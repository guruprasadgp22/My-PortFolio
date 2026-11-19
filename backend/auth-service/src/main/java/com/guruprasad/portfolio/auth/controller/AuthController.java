package com.guruprasad.portfolio.auth.controller;

import com.guruprasad.portfolio.auth.dto.LoginRequest;
import com.guruprasad.portfolio.auth.dto.PasswordChangeRequest;
import com.guruprasad.portfolio.auth.security.SessionTokens;
import com.guruprasad.portfolio.auth.service.AuthService;
import com.guruprasad.portfolio.common.security.Caller;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * POST /api/admin/login     { username, password } → sets the session cookie
 * POST /api/admin/logout    ends this session
 * GET  /api/admin/me        who is signed in (the gateway has already checked the session)
 * POST /api/admin/password  { current, next } → new password, every other session ends
 */
@RestController
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/api/admin/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        AuthService.SignIn in = auth.login(body.username(), body.password(), Caller.ip(request), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, SessionTokens.cookie(in.token()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(Map.of("user", in.user()));
    }

    @PostMapping("/api/admin/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        auth.logout(cookie(request));
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, SessionTokens.clearedCookie()).body(Map.of("ok", true));
    }

    @GetMapping("/api/admin/me")
    public Map<String, String> me(HttpServletRequest request) {
        return Map.of("user", Caller.requireAdmin(request));
    }

    @PostMapping("/api/admin/password")
    public ResponseEntity<Map<String, Boolean>> password(@RequestBody PasswordChangeRequest body, HttpServletRequest request) {
        String user = Caller.requireAdmin(request);
        AuthService.SignIn in = auth.changePassword(user, body.current(), body.next(), Caller.ip(request), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, SessionTokens.cookie(in.token())).body(Map.of("ok", true));
    }

    private static String cookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie c : request.getCookies()) {
            if (SessionTokens.COOKIE.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
