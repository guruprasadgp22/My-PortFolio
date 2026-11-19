package com.guruprasad.portfolio.contest.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.security.Caller;
import com.guruprasad.portfolio.contest.service.ContestService;
import jakarta.servlet.http.HttpServletRequest;
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
 * POST   /api/admin/contests        add a contest
 * PUT    /api/admin/contests/{id}   edit it
 * DELETE /api/admin/contests/{id}   remove it
 * GET    /api/internal/contests     every contest, for content-service
 */
@RestController
public class ContestController {

    private final ContestService contests;

    public ContestController(ContestService contests) {
        this.contests = contests;
    }

    @PostMapping("/api/admin/contests")
    public Map<String, Object> add(@RequestBody JsonNode body, HttpServletRequest request) {
        return Map.of("ok", true, "id", contests.add(body, Caller.requireAdmin(request)));
    }

    @PutMapping("/api/admin/contests/{id}")
    public Map<String, Boolean> update(@PathVariable String id, @RequestBody JsonNode body, HttpServletRequest request) {
        contests.update(id, body, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @DeleteMapping("/api/admin/contests/{id}")
    public Map<String, Boolean> delete(@PathVariable String id, HttpServletRequest request) {
        contests.delete(id, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }

    @GetMapping("/api/internal/contests")
    public List<Map<String, Object>> internal(@RequestParam(defaultValue = "false") boolean admin) {
        return contests.list(admin);
    }
}
