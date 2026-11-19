package com.guruprasad.portfolio.gateway.security;

import org.springframework.http.HttpMethod;
import org.springframework.http.server.PathContainer;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.List;

/**
 * Every request the site makes, and who may make it. This is an allow-list: a method and path that isn't listed
 * here is answered 404 before it reaches any service, so there's nothing else to probe.
 * Rules are checked top to bottom and the first match wins.
 */
public final class AccessRules {

    public enum Access { PUBLIC, ADMIN, NOT_FOUND }

    /** What a request is, for rate limits: sign-in, the chatbot, admin work or public reading. */
    public enum Kind { LOGIN, CHAT, ADMIN, PUBLIC }

    public record Match(Access access, Kind kind, long maxBody) {
    }

    private record Rule(HttpMethod method, PathPattern pattern, Match match) {
    }

    private static final long KB = 1024, MB = 1024 * KB;
    private static final PathPatternParser PARSER = PathPatternParser.defaultInstance;

    private static final List<Rule> RULES = List.of(
            // public: what every visitor's browser loads
            rule(HttpMethod.GET, "/api/content", Access.PUBLIC, Kind.PUBLIC, 0),
            rule(HttpMethod.GET, "/api/stats", Access.PUBLIC, Kind.PUBLIC, 0),
            rule(HttpMethod.GET, "/api/playlists", Access.PUBLIC, Kind.PUBLIC, 0),
            rule(HttpMethod.GET, "/api/img/{id}", Access.PUBLIC, Kind.PUBLIC, 0),
            rule(HttpMethod.POST, "/api/chat", Access.PUBLIC, Kind.CHAT, 32 * KB),
            rule(HttpMethod.POST, "/api/admin/login", Access.PUBLIC, Kind.LOGIN, 4 * KB),
            rule(HttpMethod.POST, "/api/admin/logout", Access.PUBLIC, Kind.ADMIN, 4 * KB),

            // admin: only with a valid session
            rule(HttpMethod.GET, "/api/admin/me", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.POST, "/api/admin/password", Access.ADMIN, Kind.LOGIN, 4 * KB),
            rule(HttpMethod.GET, "/api/admin/data", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.PUT, "/api/admin/sections/{key}", Access.ADMIN, Kind.ADMIN, 512 * KB),
            rule(HttpMethod.DELETE, "/api/admin/sections/{key}", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.POST, "/api/admin/learning/import", Access.ADMIN, Kind.ADMIN, 128 * KB),
            rule(HttpMethod.POST, "/api/admin/learning", Access.ADMIN, Kind.ADMIN, 16 * KB),
            rule(HttpMethod.PUT, "/api/admin/learning/{id}", Access.ADMIN, Kind.ADMIN, 16 * KB),
            rule(HttpMethod.DELETE, "/api/admin/learning/{id}", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.PUT, "/api/admin/coding/{platform}", Access.ADMIN, Kind.ADMIN, 4 * KB),
            rule(HttpMethod.DELETE, "/api/admin/coding/{platform}", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.POST, "/api/admin/contests", Access.ADMIN, Kind.ADMIN, 16 * KB),
            rule(HttpMethod.PUT, "/api/admin/contests/{id}", Access.ADMIN, Kind.ADMIN, 16 * KB),
            rule(HttpMethod.DELETE, "/api/admin/contests/{id}", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.GET, "/api/admin/images", Access.ADMIN, Kind.ADMIN, 0),
            rule(HttpMethod.POST, "/api/admin/images", Access.ADMIN, Kind.ADMIN, 6 * MB),
            rule(HttpMethod.DELETE, "/api/admin/images/{id}", Access.ADMIN, Kind.ADMIN, 0)
    );

    private static final Match NONE = new Match(Access.NOT_FOUND, Kind.PUBLIC, 0);

    private AccessRules() {
    }

    private static Rule rule(HttpMethod method, String pattern, Access access, Kind kind, long maxBody) {
        return new Rule(method, PARSER.parse(pattern), new Match(access, kind, maxBody));
    }

    public static Match resolve(HttpMethod method, String path) {
        PathContainer container = PathContainer.parsePath(path);
        for (Rule r : RULES) {
            if (r.method().equals(method) && r.pattern().matches(container)) {
                return r.match();
            }
        }
        return NONE;
    }
}
