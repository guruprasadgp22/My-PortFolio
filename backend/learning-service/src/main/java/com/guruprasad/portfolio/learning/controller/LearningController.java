package com.guruprasad.portfolio.learning.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.security.Caller;
import com.guruprasad.portfolio.learning.service.LearningService;
import com.guruprasad.portfolio.learning.service.PlaylistService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * GET    /api/playlists                 every course's lessons from YouTube (public)
 * POST   /api/admin/learning            add a course
 * POST   /api/admin/learning/import     copy the site's built-in courses in (only when there are none)
 * PUT    /api/admin/learning/{id}       edit progress, title, topics…
 * DELETE /api/admin/learning/{id}       remove a course
 * GET    /api/internal/learning         the courses, for content-service
 */
@RestController
public class LearningController {

    private final LearningService learning;
    private final PlaylistService playlists;

    public LearningController(LearningService learning, PlaylistService playlists) {
        this.learning = learning;
        this.playlists = playlists;
    }

    @GetMapping("/api/playlists")
    public ResponseEntity<Map<String, Object>> playlists() {
        return ResponseEntity.ok().header("Cache-Control", "public, max-age=600").body(playlists.all());
    }

    @PostMapping("/api/admin/learning")
    public Map<String, Object> add(@RequestBody JsonNode body, HttpServletRequest request) {
        return Map.of("ok", true, "list", learning.add(body, Caller.requireAdmin(request)));
    }

    @PostMapping("/api/admin/learning/import")
    public Map<String, Object> importBuiltIn(@RequestBody JsonNode body, HttpServletRequest request) {
        return Map.of("imported", learning.importBuiltIn(body, Caller.requireAdmin(request)));
    }

    @PutMapping("/api/admin/learning/{id}")
    public Map<String, Boolean> update(@PathVariable String id, @RequestBody JsonNode body, HttpServletRequest request) {
        learning.update(id, body, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @DeleteMapping("/api/admin/learning/{id}")
    public Map<String, Boolean> delete(@PathVariable String id, HttpServletRequest request) {
        learning.delete(id, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @GetMapping("/api/internal/learning")
    public List<Map<String, Object>> internal(@RequestParam(defaultValue = "false") boolean admin) {
        return learning.list(admin);
    }
}
