package com.guruprasad.portfolio.common.client;

import com.guruprasad.portfolio.common.security.InternalAuthFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

import java.util.concurrent.CompletableFuture;

/**
 * Calls another service by its Eureka name (http://content-service/...), with the internal token attached.
 * Used for the few things one service needs from another, e.g. content-service gathering every page's data.
 */
public class InternalClient {

    private static final Logger log = LoggerFactory.getLogger(InternalClient.class);

    private final RestClient client;

    public InternalClient(RestClient.Builder loadBalanced, String token) {
        this.client = loadBalanced.defaultHeader(InternalAuthFilter.HEADER, token).build();
    }

    public <T> T get(String url, ParameterizedTypeReference<T> type) {
        return client.get().uri(url).retrieve().body(type);
    }

    public <T> T get(String url, Class<T> type) {
        return client.get().uri(url).retrieve().body(type);
    }

    public <T> T post(String url, Object body, Class<T> type) {
        return client.post().uri(url).body(body == null ? "{}" : body).header("Content-Type", "application/json").retrieve().body(type);
    }

    /**
     * Tells content-service that something on the site changed, so the combined /api/content is rebuilt and the
     * edit shows straight away. Never fails the caller's request: at worst the change shows within a minute.
     */
    public void contentChanged() {
        CompletableFuture.runAsync(() -> {
            try {
                post("http://content-service/api/internal/content/touched", null, String.class);
            } catch (Exception e) {
                log.warn("Couldn't tell content-service about a change: {}", e.getMessage());
            }
        });
    }
}
