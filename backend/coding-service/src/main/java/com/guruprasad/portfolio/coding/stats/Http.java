package com.guruprasad.portfolio.coding.stats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Outgoing requests to the coding platforms. A regular browser User-Agent, because some (Code360) reject others.
 * Every request gives up after 8 seconds, so one slow platform can't hold up the page.
 */
@Component
public class Http {

    public static final String UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
    private static final Duration TIMEOUT = Duration.ofSeconds(8);

    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NORMAL).build();
    private final ObjectMapper json;

    public Http(ObjectMapper json) {
        this.json = json;
    }

    public record Page(int status, String finalUrl, String body) {
    }

    public JsonNode getJson(String url) throws IOException, InterruptedException {
        return parse(url, send(HttpRequest.newBuilder(URI.create(url)).GET(), Map.of()));
    }

    public JsonNode postJson(String url, Object body, Map<String, String> headers) throws IOException, InterruptedException {
        String payload = body instanceof String s ? s : json.writeValueAsString(body);
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url)).POST(HttpRequest.BodyPublishers.ofString(payload)).header("Content-Type", "application/json");
        return parse(url, send(b, headers));
    }

    public Page getPage(String url) throws IOException, InterruptedException {
        HttpResponse<String> res = send(HttpRequest.newBuilder(URI.create(url)).GET(), Map.of());
        return new Page(res.statusCode(), res.uri().toString(), res.body());
    }

    public ObjectMapper mapper() {
        return json;
    }

    private HttpResponse<String> send(HttpRequest.Builder b, Map<String, String> headers) throws IOException, InterruptedException {
        b.timeout(TIMEOUT).header("User-Agent", UA);
        headers.forEach(b::header);
        return client.send(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode parse(String url, HttpResponse<String> res) throws IOException {
        if (res.statusCode() < 200 || res.statusCode() > 299) {
            throw new IOException(URI.create(url).getHost() + " → " + res.statusCode());
        }
        return json.readTree(res.body());
    }
}
