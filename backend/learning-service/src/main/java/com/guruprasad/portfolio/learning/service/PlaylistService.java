package com.guruprasad.portfolio.learning.service;

import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.learning.entity.Course;
import com.guruprasad.portfolio.learning.repository.CourseRepository;
import com.guruprasad.portfolio.learning.youtube.Lesson;
import com.guruprasad.portfolio.learning.youtube.YouTubeClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The lesson list of every course, from YouTube: { updated, lists: { playlistId: { count, lessons } } }.
 * Only playlists saved as courses are fetched, never one named in a request. Each list is kept for a day and
 * fetched again after any change to the courses. A playlist that fails is left out (the site then shows its
 * built-in copy) and tried again on the next request.
 */
@Service
public class PlaylistService {

    private static final Logger log = LoggerFactory.getLogger(PlaylistService.class);
    private static final Duration KEEP = Duration.ofHours(24);

    private record Kept(List<Lesson> lessons, long at) {
    }

    private final CourseRepository courses;
    private final YouTubeClient youtube;
    private final Map<String, Kept> kept = new ConcurrentHashMap<>();
    private final ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

    public PlaylistService(CourseRepository courses, YouTubeClient youtube) {
        this.courses = courses;
        this.youtube = youtube;
    }

    public Map<String, Object> all() {
        if (!youtube.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "No YouTube API key configured");
        }
        List<String> ids = courses.inPageOrder().stream().map(Course::getId).limit(30).toList();
        Map<String, CompletableFuture<List<Lesson>>> pending = new LinkedHashMap<>();
        for (String id : ids) {
            pending.put(id, CompletableFuture.supplyAsync(() -> one(id), pool));
        }
        Map<String, Object> lists = new LinkedHashMap<>();
        pending.forEach((id, f) -> {
            List<Lesson> lessons = f.join();
            if (lessons != null) {
                lists.put(id, Map.of("count", lessons.size(), "lessons", lessons));
            }
        });
        return Map.of("updated", Instant.now().toString(), "lists", lists);
    }

    private List<Lesson> one(String id) {
        Kept k = kept.get(id);
        if (k != null && System.currentTimeMillis() - k.at() < KEEP.toMillis()) {
            return k.lessons();
        }
        try {
            List<Lesson> lessons = youtube.playlist(id);
            kept.put(id, new Kept(lessons, System.currentTimeMillis()));
            return lessons;
        } catch (Exception e) {
            log.warn("Playlist {} didn't load: {}", id, e.getMessage());
            return k != null ? k.lessons() : null;
        }
    }

    public void forget() {
        kept.clear();
    }
}
