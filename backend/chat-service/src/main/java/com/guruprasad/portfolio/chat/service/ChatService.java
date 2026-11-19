package com.guruprasad.portfolio.chat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.common.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

/**
 * The "Ask GP" assistant and the job description matcher, through the Anthropic API (ANTHROPIC_API_KEY, kept only on
 * the server). Cost and abuse limits: short messages, 10 messages of context, short answers, and per-visitor limits
 * of 20 questions and 5 job descriptions per 10 minutes. Set a monthly spend limit in the Anthropic console too.
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final int MSG_CHARS = 600, JD_CHARS = 6000, HISTORY = 10, CHAT_TOKENS = 600, JD_TOKENS = 1000;
    private static final Map<String, Integer> PER_VISITOR = Map.of("chat", 20, "jd", 5);
    private static final Duration WINDOW = Duration.ofMinutes(10);

    private final Knowledge knowledge;
    private final ObjectMapper json;
    private final String apiKey, model, api;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public ChatService(Knowledge knowledge, ObjectMapper json,
                       @Value("${portfolio.anthropic.key:}") String apiKey,
                       @Value("${portfolio.anthropic.model}") String model,
                       @Value("${portfolio.anthropic.base-url}") String api) {
        this.knowledge = knowledge;
        this.json = json;
        this.apiKey = apiKey;
        this.model = model;
        this.api = api.replaceAll("/+$", "");
    }

    public boolean configured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void limit(String ip, String mode) {
        long now = System.currentTimeMillis();
        Deque<Long> recent = hits.computeIfAbsent(mode + ":" + ip, k -> new ArrayDeque<>());
        synchronized (recent) {
            while (!recent.isEmpty() && now - recent.peekFirst() > WINDOW.toMillis()) {
                recent.pollFirst();
            }
            if (recent.size() >= PER_VISITOR.get(mode)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many questions in a short time. Please try again in a few minutes.");
            }
            recent.addLast(now);
        }
        if (hits.size() > 5000) {
            hits.clear();
        }
    }

    /** Chat: the last few turns, trimmed, with visitor text wrapped so it can't pose as instructions. */
    public ArrayNode messages(JsonNode body) {
        List<ObjectNode> msgs = new ArrayList<>();
        JsonNode list = body.path("messages");
        if (list.isArray()) {
            for (JsonNode m : list) {
                String role = m.path("role").asText("");
                JsonNode c = m.get("content");
                if ((role.equals("user") || role.equals("assistant")) && c != null && c.isTextual() && !c.textValue().isBlank()) {
                    String text = c.textValue();
                    ObjectNode o = json.createObjectNode();
                    o.put("role", role);
                    o.put("content", role.equals("user") ? "<visitor>" + cut(text, MSG_CHARS) + "</visitor>" : cut(text, 2000));
                    msgs.add(o);
                }
            }
        }
        List<ObjectNode> last = msgs.subList(Math.max(0, msgs.size() - HISTORY), msgs.size());
        int start = 0;
        while (start < last.size() && !"user".equals(last.get(start).get("role").asText())) {
            start++;
        }
        ArrayNode out = json.createArrayNode();
        last.subList(start, last.size()).forEach(out::add);
        if (out.isEmpty() || !"user".equals(out.get(out.size() - 1).get("role").asText())) {
            throw ApiException.badRequest("Ask a question.");
        }
        return out;
    }

    /** Streams the answer as plain text while Claude writes it. */
    public void stream(ArrayNode messages, OutputStream out) throws IOException {
        ObjectNode req = request(Prompts.chat(knowledge), CHAT_TOKENS, messages);
        req.put("stream", true);
        HttpResponse<Stream<String>> res;
        try {
            res = http.send(post(req), HttpResponse.BodyHandlers.ofLines());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException(e);
        }
        if (res.statusCode() != 200) {
            log.warn("Anthropic answered {}", res.statusCode());
            res.body().close();
            out.write("Sorry, something went wrong on my side. Please try again.".getBytes(StandardCharsets.UTF_8));
            return;
        }
        try (Stream<String> lines = res.body()) {
            for (String line : (Iterable<String>) lines::iterator) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                JsonNode ev;
                try {
                    ev = json.readTree(line.substring(5));
                } catch (IOException e) {
                    continue;
                }
                String type = ev.path("type").asText();
                if (type.equals("content_block_delta") && ev.path("delta").path("type").asText().equals("text_delta")) {
                    out.write(ev.path("delta").path("text").asText().getBytes(StandardCharsets.UTF_8));
                    out.flush();
                } else if (type.equals("error")) {
                    out.write("\n\nSorry, something went wrong on my side. Please try again.".getBytes(StandardCharsets.UTF_8));
                }
            }
        }
    }

    /** Job description → match report (score, matched and missing skills, fitting projects, a short pitch). */
    public Map<String, Object> matchJob(JsonNode body) throws IOException, InterruptedException {
        String jd = cut(body.path("jd").asText("").strip(), JD_CHARS);
        if (jd.length() < 40) {
            throw ApiException.badRequest("Paste a longer job description.");
        }
        ArrayNode messages = json.createArrayNode();
        messages.addObject().put("role", "user").put("content", "<jd>\n" + jd + "\n</jd>");
        HttpResponse<String> res = http.send(post(request(Prompts.jd(knowledge), JD_TOKENS, messages)), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            log.warn("Anthropic answered {}", res.statusCode());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "upstream");
        }
        StringBuilder text = new StringBuilder();
        json.readTree(res.body()).path("content").forEach(c -> text.append(c.path("text").asText("")));
        JsonNode r;
        try {
            int a = text.indexOf("{"), b = text.lastIndexOf("}");
            r = json.readTree(text.substring(a, b + 1));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "unreadable");
        }
        Set<String> titles = knowledge.projectTitles();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("score", Math.max(0, Math.min(100, (int) Math.round(r.path("score").asDouble(0)))));
        out.put("role", cut(r.path("role").asText(""), 80));
        out.put("verdict", cut(r.path("verdict").asText(""), 300));
        out.put("matched", strings(r.path("matched"), 10));
        out.put("missing", strings(r.path("missing"), 8));
        List<Map<String, String>> projects = new ArrayList<>();
        for (JsonNode p : r.path("projects")) {
            if (projects.size() < 3 && titles.contains(p.path("t").asText())) {
                projects.add(Map.of("t", p.path("t").asText(), "why", cut(p.path("why").asText(""), 200)));
            }
        }
        out.put("projects", projects);
        out.put("pitch", cut(r.path("pitch").asText(""), 700));
        out.put("source", "ai");
        return out;
    }

    private ObjectNode request(String rules, int maxTokens, ArrayNode messages) {
        ObjectNode req = json.createObjectNode();
        req.put("model", model);
        req.put("max_tokens", maxTokens);
        ObjectNode system = req.putArray("system").addObject();
        system.put("type", "text");
        system.put("text", rules + "\n\n<knowledge>\n" + knowledge.text() + "\n</knowledge>");
        system.putObject("cache_control").put("type", "ephemeral");
        req.set("messages", messages);
        return req;
    }

    private HttpRequest post(ObjectNode body) {
        return HttpRequest.newBuilder(URI.create(api + "/v1/messages"))
                .timeout(Duration.ofSeconds(45))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
    }

    private static List<String> strings(JsonNode arr, int max) {
        List<String> out = new ArrayList<>();
        arr.forEach(x -> {
            if (out.size() < max) {
                out.add(cut(x.asText(""), 200));
            }
        });
        return out;
    }

    private static String cut(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
