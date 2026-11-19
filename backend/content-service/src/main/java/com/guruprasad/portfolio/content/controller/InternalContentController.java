package com.guruprasad.portfolio.content.controller;

import com.guruprasad.portfolio.content.service.ContentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Service-to-service only (the gateway blocks /api/internal/** from outside). */
@RestController
public class InternalContentController {

    private final ContentService content;

    public InternalContentController(ContentService content) {
        this.content = content;
    }

    @PostMapping("/api/internal/content/touched")
    public Map<String, Boolean> touched() {
        content.changed();
        return Map.of("ok", true);
    }

    @GetMapping("/api/internal/sections/using-image/{id}")
    public List<String> usingImage(@PathVariable String id) {
        return content.sectionsUsingImage(id);
    }
}
