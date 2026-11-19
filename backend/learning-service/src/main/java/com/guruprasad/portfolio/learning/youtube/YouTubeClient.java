package com.guruprasad.portfolio.learning.youtube;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Every video of a public playlist through the official YouTube Data API v3 (YOUTUBE_API_KEY): playlistItems 50 at a
 * time, then videos for their lengths. About 2 quota units per 50 videos; the free quota is 10,000 a day.
 * The key stays on the server; it never reaches a browser.
 */
@Component
public class YouTubeClient {

    private static final String API = "https://www.googleapis.com/youtube/v3/";
    private static final Pattern ISO = Pattern.compile("P(?:(\\d+)D)?T?(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?");

    private final String key;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public YouTubeClient(@Value("${portfolio.youtube-key:}") String key, ObjectMapper json) {
        this.key = key;
        this.json = json;
    }

    public boolean configured() {
        return key != null && !key.isBlank();
    }

    public List<Lesson> playlist(String list) throws IOException, InterruptedException {
        List<JsonNode> items = new ArrayList<>();
        String page = null;
        do {
            Map<String, String> q = new LinkedHashMap<>(Map.of("part", "snippet", "playlistId", list, "maxResults", "50"));
            if (page != null) {
                q.put("pageToken", page);
            }
            JsonNode body = get("playlistItems", q);
            body.path("items").forEach(items::add);
            page = body.path("nextPageToken").isTextual() ? body.path("nextPageToken").textValue() : null;
        } while (page != null && items.size() < 1000);

        record Video(String id, String title, int pos) {
        }
        List<Video> videos = items.stream()
                .map(i -> new Video(i.path("snippet").path("resourceId").path("videoId").asText(null), i.path("snippet").path("title").asText(""), i.path("snippet").path("position").asInt(0)))
                // deleted and private videos stay in a playlist without a title worth showing
                .filter(v -> v.id() != null && !v.title().matches("(Deleted|Private) video"))
                .sorted(Comparator.comparingInt(Video::pos))
                .toList();

        Map<String, Integer> length = new HashMap<>();
        for (int i = 0; i < videos.size(); i += 50) {
            String ids = videos.subList(i, Math.min(i + 50, videos.size())).stream().map(Video::id).collect(Collectors.joining(","));
            get("videos", Map.of("part", "contentDetails", "id", ids, "maxResults", "50")).path("items")
                    .forEach(x -> length.put(x.path("id").asText(), seconds(x.path("contentDetails").path("duration").asText(""))));
        }
        return videos.stream().map(v -> {
            TitleTidy.Tidy t = TitleTidy.tidy(v.title());
            return new Lesson(v.id(), t.title(), length.getOrDefault(v.id(), 0), t.leetcode());
        }).toList();
    }

    private JsonNode get(String path, Map<String, String> params) throws IOException, InterruptedException {
        Map<String, String> q = new LinkedHashMap<>(params);
        q.put("key", key);
        String query = q.entrySet().stream().map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8)).collect(Collectors.joining("&"));
        HttpRequest req = HttpRequest.newBuilder(URI.create(API + path + "?" + query)).timeout(Duration.ofSeconds(8)).GET().build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            // the error text is logged, never sent to the browser (it could mention the key's project)
            throw new IOException("YouTube " + path + " → " + res.statusCode());
        }
        return json.readTree(res.body());
    }

    static int seconds(String iso) {
        Matcher m = ISO.matcher(iso);
        if (!m.find()) {
            return 0;
        }
        int[] f = new int[4];
        for (int i = 0; i < 4; i++) {
            f[i] = m.group(i + 1) == null ? 0 : Integer.parseInt(m.group(i + 1));
        }
        return f[0] * 86400 + f[1] * 3600 + f[2] * 60 + f[3];
    }
}
