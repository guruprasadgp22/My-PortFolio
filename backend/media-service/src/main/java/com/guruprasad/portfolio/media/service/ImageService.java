package com.guruprasad.portfolio.media.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.media.entity.Image;
import com.guruprasad.portfolio.media.repository.ImageRepository;
import com.guruprasad.portfolio.media.validation.ImageValidator;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);

    private final ImageRepository images;
    private final InternalClient services;

    public ImageService(ImageRepository images, InternalClient services) {
        this.images = images;
        this.services = services;
    }

    public List<Map<String, Object>> library() {
        return images.library(PageRequest.of(0, 300)).stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            String id = i.getId().toHexString();
            m.put("id", id);
            m.put("url", "/api/img/" + id);
            m.put("name", i.getName());
            m.put("type", i.getType());
            m.put("w", i.getW());
            m.put("h", i.getH());
            m.put("bytes", i.getBytes());
            m.put("createdAt", i.getCreatedAt());
            return m;
        }).toList();
    }

    public String upload(JsonNode body, String admin) {
        Image img = ImageValidator.clean(body);
        img.setCreatedAt(new Date());
        String id = images.insert(img).getId().toHexString();
        log.info("Image uploaded: {} ({} bytes) by {}", id, img.getBytes(), admin);
        return id;
    }

    public void delete(String id, String admin) {
        ObjectId oid = parse(id).orElseThrow(() -> ApiException.notFound("Image not found"));
        // refuse while a page still shows it, so deleting can't leave a broken picture on the site
        List<String> used;
        try {
            used = services.get("http://content-service/api/internal/sections/using-image/" + id, new ParameterizedTypeReference<List<String>>() {
            });
        } catch (Exception e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Couldn't check where the image is used. Try again.");
        }
        if (used != null && !used.isEmpty()) {
            throw ApiException.conflict("Still used in " + String.join(", ", used) + ". Remove it there first.");
        }
        if (!images.existsById(oid)) {
            throw ApiException.notFound("Image not found");
        }
        images.deleteById(oid);
        log.info("Image deleted: {} by {}", id, admin);
    }

    public Optional<Image> find(String id) {
        return parse(id).flatMap(images::findById);
    }

    private static Optional<ObjectId> parse(String id) {
        return id != null && ObjectId.isValid(id) && new ObjectId(id).toHexString().equals(id) ? Optional.of(new ObjectId(id)) : Optional.empty();
    }
}
