package com.guruprasad.portfolio.media.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.security.Caller;
import com.guruprasad.portfolio.media.entity.Image;
import com.guruprasad.portfolio.media.service.ImageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * GET    /api/img/{id}[?size=small]   the image (public; kept by browsers for a year, it never changes)
 * GET    /api/admin/images            the image library
 * POST   /api/admin/images            upload { name, w, h, full: base64, small: base64 }
 * DELETE /api/admin/images/{id}       only when no page uses it
 */
@RestController
public class ImageController {

    private final ImageService images;

    public ImageController(ImageService images) {
        this.images = images;
    }

    @GetMapping("/api/img/{id}")
    public ResponseEntity<byte[]> image(@PathVariable String id, @RequestParam(required = false) String size) {
        Image img = images.find(id).orElse(null);
        if (img == null) {
            return ResponseEntity.status(404).header("Cache-Control", "public, max-age=60").contentType(MediaType.TEXT_PLAIN).body("Not found".getBytes());
        }
        byte[] bin = "small".equals(size) && img.getSmall() != null ? img.getSmall() : img.getFull();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getType()))
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .header("Content-Disposition", "inline")
                .body(bin);
    }

    @GetMapping("/api/admin/images")
    public Map<String, Object> library(HttpServletRequest request) {
        Caller.requireAdmin(request);
        return Map.of("images", images.library());
    }

    @PostMapping("/api/admin/images")
    public Map<String, Object> upload(@RequestBody JsonNode body, HttpServletRequest request) {
        String id = images.upload(body, Caller.requireAdmin(request));
        return Map.of("ok", true, "id", id, "url", "/api/img/" + id);
    }

    @DeleteMapping("/api/admin/images/{id}")
    public Map<String, Boolean> delete(@PathVariable String id, HttpServletRequest request) {
        images.delete(id, Caller.requireAdmin(request));
        return Map.of("ok", true);
    }
}
