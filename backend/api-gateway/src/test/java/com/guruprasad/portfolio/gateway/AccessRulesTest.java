package com.guruprasad.portfolio.gateway;

import com.guruprasad.portfolio.gateway.security.AccessRules;
import com.guruprasad.portfolio.gateway.security.AccessRules.Access;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AccessRulesTest {

    private static Access access(HttpMethod m, String path) {
        return AccessRules.resolve(m, path).access();
    }

    @Test
    void publicReads() {
        assertEquals(Access.PUBLIC, access(HttpMethod.GET, "/api/content"));
        assertEquals(Access.PUBLIC, access(HttpMethod.GET, "/api/stats"));
        assertEquals(Access.PUBLIC, access(HttpMethod.GET, "/api/img/6aff0d3592ed525ca802e100"));
        assertEquals(Access.PUBLIC, access(HttpMethod.POST, "/api/admin/login"));
    }

    @Test
    void adminNeedsSession() {
        assertEquals(Access.ADMIN, access(HttpMethod.GET, "/api/admin/data"));
        assertEquals(Access.ADMIN, access(HttpMethod.PUT, "/api/admin/sections/ME"));
        assertEquals(Access.ADMIN, access(HttpMethod.DELETE, "/api/admin/images/abc"));
        assertEquals(Access.ADMIN, access(HttpMethod.GET, "/api/admin/me"));
    }

    @Test
    void everythingElseIsNotFound() {
        assertEquals(Access.NOT_FOUND, access(HttpMethod.GET, "/api/internal/learning"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.POST, "/api/internal/content/touched"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.DELETE, "/api/content"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.GET, "/api/admin/sections/ME/extra"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.GET, "/actuator/env"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.PATCH, "/api/admin/learning/x"));
        assertEquals(Access.NOT_FOUND, access(HttpMethod.GET, "/"));
    }
}
