package com.guruprasad.portfolio.gateway.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window request limits per visitor address, plus one shared limit on sign-in attempts from everyone
 * together, so spreading guesses over many addresses doesn't help either. Kept in memory: the gateway is a
 * single instance.
 */
@Component
public class RateLimiter {

    private record Limit(int max, Duration window) {
    }

    private static final Map<AccessRules.Kind, Limit> PER_IP = Map.of(
            AccessRules.Kind.LOGIN, new Limit(10, Duration.ofMinutes(15)),
            AccessRules.Kind.CHAT, new Limit(30, Duration.ofMinutes(10)),
            AccessRules.Kind.ADMIN, new Limit(300, Duration.ofMinutes(1)),
            AccessRules.Kind.PUBLIC, new Limit(240, Duration.ofMinutes(1)));
    private static final Limit ALL_LOGINS = new Limit(60, Duration.ofMinutes(15));

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger();

        Window(long start) {
            this.start = start;
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /** Seconds to wait before trying again, or 0 when the request is allowed. */
    public long check(AccessRules.Kind kind, String ip) {
        Limit limit = PER_IP.get(kind);
        long wait = hit(kind + ":" + ip, limit);
        if (wait == 0 && kind == AccessRules.Kind.LOGIN) {
            wait = hit("login:*", ALL_LOGINS);
        }
        return wait;
    }

    private long hit(String key, Limit limit) {
        long now = System.currentTimeMillis();
        long size = limit.window().toMillis();
        Window w = windows.compute(key, (k, cur) -> cur == null || now - cur.start >= size ? new Window(now) : cur);
        if (w.count.incrementAndGet() <= limit.max()) {
            return 0;
        }
        return Math.max(1, (w.start + size - now) / 1000);
    }

    @Scheduled(fixedDelay = 60_000)
    void forgetOldWindows() {
        long now = System.currentTimeMillis();
        windows.entrySet().removeIf(e -> now - e.getValue().start > Duration.ofMinutes(15).toMillis());
    }
}
