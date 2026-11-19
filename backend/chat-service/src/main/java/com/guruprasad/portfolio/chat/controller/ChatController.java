package com.guruprasad.portfolio.chat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.guruprasad.portfolio.chat.service.ChatService;
import com.guruprasad.portfolio.common.security.Caller;
import com.guruprasad.portfolio.common.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * POST /api/chat
 *   { mode: "chat", messages: [{ role, content }] }  → the answer, streamed as plain text
 *   { mode: "jd", jd: "<job description>" }          → JSON match report
 * Without an API key this answers 503 and the site falls back to its offline answers.
 */
@RestController
public class ChatController {

    private final ChatService chat;

    public ChatController(ChatService chat) {
        this.chat = chat;
    }

    @PostMapping("/api/chat")
    public ResponseEntity<?> chat(@RequestBody JsonNode body, HttpServletRequest request) throws Exception {
        if (!chat.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "offline");
        }
        String mode = "jd".equals(body.path("mode").asText()) ? "jd" : "chat";
        chat.limit(Caller.ip(request), mode);
        if (mode.equals("jd")) {
            return ResponseEntity.ok().header("Cache-Control", "no-store").body(chat.matchJob(body));
        }
        ArrayNode messages = chat.messages(body);
        StreamingResponseBody stream = out -> chat.stream(messages, out);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "plain", java.nio.charset.StandardCharsets.UTF_8))
                .header("Cache-Control", "no-store")
                .header("X-Chat-Source", "ai")
                .header("X-Accel-Buffering", "no")
                .body(stream);
    }
}
