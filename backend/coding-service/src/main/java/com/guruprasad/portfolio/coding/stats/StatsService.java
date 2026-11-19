package com.guruprasad.portfolio.coding.stats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Live coding stats for the Coding and Contests pages: every platform at once, each on its own (one failing never
 * breaks the others). Every platform that loads is saved to MongoDB (collection "live") as its last good copy, and a
 * platform that fails is answered from that copy instead, listed in `snap` with when it's from.
 * The answer is kept for 3 hours and refreshed in the background, so visitors never wait for the platforms.
 */
@Service
public class StatsService {

    private static final Logger log = LoggerFactory.getLogger(StatsService.class);
    private static final Duration KEEP = Duration.ofHours(3);

    private record Kept(ObjectNode body, long at) {
    }

    private final List<PlatformFetcher> fetchers;
    private final MongoTemplate mongo;
    private final ObjectMapper json;
    private final AtomicReference<Kept> kept = new AtomicReference<>();
    private final ReentrantLock refreshing = new ReentrantLock();
    private final ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

    public StatsService(List<PlatformFetcher> fetchers, MongoTemplate mongo, ObjectMapper json) {
        this.fetchers = fetchers;
        this.mongo = mongo;
        this.json = json;
    }

    public ObjectNode current() {
        Kept k = kept.get();
        if (k == null) {
            return refresh();
        }
        if (System.currentTimeMillis() - k.at() > KEEP.toMillis()) {
            pool.submit(this::refresh);
        }
        return k.body();
    }

    @Scheduled(initialDelay = 5_000, fixedDelay = 3 * 60 * 60 * 1000)
    public void scheduledRefresh() {
        refresh();
    }

    /** Loads every platform (one refresh at a time; anyone arriving meanwhile gets the result of the running one). */
    public ObjectNode refresh() {
        if (!refreshing.tryLock()) {
            refreshing.lock();
            refreshing.unlock();
            Kept k = kept.get();
            return k != null ? k.body() : refresh();
        }
        try {
            ObjectNode body = json.createObjectNode();
            String updated = Instant.now().toString();
            body.put("updated", updated);
            Map<String, Future<JsonNode>> running = new LinkedHashMap<>();
            for (PlatformFetcher f : fetchers) {
                running.put(f.id(), pool.submit(f::fetch));
            }
            List<String> ok = new ArrayList<>(), failed = new ArrayList<>();
            running.forEach((id, f) -> {
                try {
                    body.set(id, f.get(40, TimeUnit.SECONDS));
                    ok.add(id);
                } catch (Exception e) {
                    log.warn("{} didn't load: {}", id, e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
                    body.putNull(id);
                    failed.add(id);
                }
            });
            withSnapshots(body, updated, ok, failed);
            kept.set(new Kept(body, System.currentTimeMillis()));
            log.info("Stats refreshed: {} live, {} from saved copies {}", ok.size(), failed.size(), failed);
            return body;
        } finally {
            refreshing.unlock();
        }
    }

    private void withSnapshots(ObjectNode body, String updated, List<String> ok, List<String> failed) {
        try {
            var live = mongo.getCollection("live");
            for (String id : ok) {
                Document doc = new Document("data", Document.parse("{\"v\":" + body.get(id).toString() + "}").get("v")).append("at", updated);
                live.replaceOne(Filters.eq("_id", id), doc, new ReplaceOptions().upsert(true));
            }
            if (failed.isEmpty()) {
                return;
            }
            ObjectNode snap = null;
            for (Document d : live.find(Filters.in("_id", failed))) {
                body.set(d.getString("_id"), json.readTree(new Document("v", d.get("data")).toJson()).get("v"));
                if (snap == null) {
                    snap = body.putObject("snap");
                }
                snap.put(d.getString("_id"), d.getString("at"));
            }
        } catch (Exception e) {
            log.warn("Saved stats unavailable: {}", e.getMessage());
        }
    }
}
