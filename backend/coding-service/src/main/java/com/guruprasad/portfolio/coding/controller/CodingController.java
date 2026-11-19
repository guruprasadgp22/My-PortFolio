package com.guruprasad.portfolio.coding.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.service.CorrectionService;
import com.guruprasad.portfolio.coding.stats.StatsService;
import com.guruprasad.portfolio.common.security.Caller;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * GET    /api/stats                       live numbers from every coding platform (public)
 * PUT    /api/admin/coding/{platform}     set corrections { solved, easy, medium, hard }
 * DELETE /api/admin/coding/{platform}     back to the live numbers
 * GET    /api/internal/coding             the corrections, for content-service
 */
@RestController
public class CodingController {

    private final StatsService stats;
    private final CorrectionService corrections;

    public CodingController(StatsService stats, CorrectionService corrections) {
        this.stats = stats;
        this.corrections = corrections;
    }

    @GetMapping("/api/stats")
    public ResponseEntity<ObjectNode> stats() {
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=300")
                .header("Netlify-CDN-Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
                .body(stats.current());
    }

    @PutMapping("/api/admin/coding/{platform}")
    public Map<String, Boolean> set(@PathVariable String platform, @RequestBody JsonNode body, HttpServletRequest request) {
        corrections.set(platform, body, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @DeleteMapping("/api/admin/coding/{platform}")
    public Map<String, Boolean> clear(@PathVariable String platform, HttpServletRequest request) {
        corrections.clear(platform, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @GetMapping("/api/internal/coding")
    public Map<String, Map<String, Object>> internal(@RequestParam(defaultValue = "false") boolean admin) {
        return corrections.all(admin);
    }
}
