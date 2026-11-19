package com.guruprasad.portfolio.auth.controller;

import com.guruprasad.portfolio.auth.dto.SessionCheck;
import com.guruprasad.portfolio.auth.service.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** For the gateway only (the gateway blocks /api/internal/** from outside): is this session still valid? */
@RestController
public class InternalSessionController {

    private final AuthService auth;

    public InternalSessionController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/api/internal/sessions/verify")
    public Map<String, Boolean> verify(@RequestBody SessionCheck check) {
        return Map.of("valid", auth.valid(check.sid(), check.user(), check.version()));
    }
}
