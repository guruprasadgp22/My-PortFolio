package com.guruprasad.portfolio.content.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.security.Caller;
import com.guruprasad.portfolio.content.service.ContentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * GET    /api/content                everything the site shows from the database (public)
 * GET    /api/admin/data             everything editable (admin)
 * PUT    /api/admin/sections/{KEY}   { data } replaces a section (admin)
 * DELETE /api/admin/sections/{KEY}   back to the built-in copy in data.js (admin)
 */
@RestController
public class ContentController {

    private final ContentService content;

    public ContentController(ContentService content) {
        this.content = content;
    }

    @GetMapping("/api/content")
    public ResponseEntity<Map<String, Object>> publicContent() {
        return ResponseEntity.ok().header("Cache-Control", "no-cache").body(content.publicContent());
    }

    @GetMapping("/api/admin/data")
    public Map<String, Object> adminData(HttpServletRequest request) {
        Caller.requireAdmin(request);
        return content.adminData();
    }

    @PutMapping("/api/admin/sections/{key}")
    public Map<String, Boolean> save(@PathVariable String key, @RequestBody JsonNode body, HttpServletRequest request) {
        content.saveSection(key, body, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @DeleteMapping("/api/admin/sections/{key}")
    public Map<String, Boolean> reset(@PathVariable String key, HttpServletRequest request) {
        content.resetSection(key, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }
}
