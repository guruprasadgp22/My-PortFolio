package com.guruprasad.portfolio.content.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.content.repository.SectionRepository;
import com.guruprasad.portfolio.content.validation.SectionValidator;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * Page sections, and the one combined answer the site loads on every visit (/api/content):
 *   { updated, sections: { KEY: data }, learning: [...], coding: { platform: fixes }, contests: [...] }
 * learning, coding and contests come from their own services. The combined answer is kept for a minute and
 * rebuilt straight away when anything changes; if a service is down, the last good answer is served instead.
 */
@Service
public class ContentService {

    private static final Logger log = LoggerFactory.getLogger(ContentService.class);
    private static final Duration KEEP = Duration.ofSeconds(60);
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {
    };

    private record Cached(Map<String, Object> body, long at) {
    }

    private final SectionRepository sections;
    private final InternalClient services;
    private final AtomicReference<Cached> cache = new AtomicReference<>();
    private final ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

    public ContentService(SectionRepository sections, InternalClient services) {
        this.sections = sections;
        this.services = services;
    }

    public Map<String, Object> publicContent() {
        Cached c = cache.get();
        if (c != null && System.currentTimeMillis() - c.at() < KEEP.toMillis()) {
            return c.body();
        }
        try {
            Map<String, Object> body = gather(false);
            cache.set(new Cached(body, System.currentTimeMillis()));
            return body;
        } catch (Exception e) {
            log.warn("Couldn't build /api/content: {}", e.getMessage());
            if (c != null) {
                return c.body();
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Content is unavailable right now");
        }
    }

    /** Everything editable, for the admin page (with when each item was last changed). */
    public Map<String, Object> adminData() {
        return gather(true);
    }

    private Map<String, Object> gather(boolean admin) {
        String q = admin ? "?admin=true" : "";
        CompletableFuture<List<Map<String, Object>>> learning = CompletableFuture.supplyAsync(() -> services.get("http://learning-service/api/internal/learning" + q, LIST), pool);
        CompletableFuture<Map<String, Object>> coding = CompletableFuture.supplyAsync(() -> services.get("http://coding-service/api/internal/coding" + q, MAP), pool);
        CompletableFuture<List<Map<String, Object>>> contests = CompletableFuture.supplyAsync(() -> services.get("http://contest-service/api/internal/contests" + q, LIST), pool);
        List<Document> saved = sections.findAll();
        Map<String, Object> out = new LinkedHashMap<>();
        try {
            if (!admin) {
                out.put("updated", sections.lastChange());
            }
            out.put("sections", saved.stream().collect(Collectors.toMap(d -> d.getString("_id"),
                    d -> admin ? Map.of("data", d.get("data"), "updatedAt", d.get("updatedAt", new java.util.Date(0))) : d.get("data"),
                    (a, b) -> a, LinkedHashMap::new)));
            out.put("learning", learning.get(6, TimeUnit.SECONDS));
            out.put("coding", coding.get(6, TimeUnit.SECONDS));
            out.put("contests", contests.get(6, TimeUnit.SECONDS));
        } catch (Exception e) {
            throw new IllegalStateException("a service didn't answer: " + e.getMessage(), e);
        }
        return out;
    }

    public void saveSection(String key, JsonNode body, String admin) {
        if (!SectionValidator.TYPES.containsKey(key)) {
            throw ApiException.badRequest("Unknown section");
        }
        Object data = SectionValidator.clean(key, body == null ? null : body.get("data"));
        sections.save(key, data);
        log.info("Section saved: {} by {}", key, admin);
        changed();
    }

    public void resetSection(String key, String admin) {
        if (!SectionValidator.TYPES.containsKey(key)) {
            throw ApiException.badRequest("Unknown section");
        }
        sections.delete(key);
        log.info("Section reset to the built-in copy: {} by {}", key, admin);
        changed();
    }

    /** Something on the site changed (here or in another service): note when, and rebuild /api/content. */
    public void changed() {
        sections.touch();
        cache.set(null);
    }

    /** The sections that show an uploaded image, so media-service can refuse to delete it while it's in use. */
    public List<String> sectionsUsingImage(String id) {
        String needle = "/api/img/" + id;
        return sections.findAll().stream()
                .filter(d -> d.get("data") != null && new Document("v", d.get("data")).toJson().contains(needle))
                .map(d -> d.getString("_id"))
                .toList();
    }
}
