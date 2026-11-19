package com.guruprasad.portfolio.coding.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.coding.entity.Correction;
import com.guruprasad.portfolio.coding.repository.CorrectionRepository;
import com.guruprasad.portfolio.coding.validation.CorrectionValidator;
import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CorrectionService {

    private static final Logger log = LoggerFactory.getLogger(CorrectionService.class);

    private final CorrectionRepository corrections;
    private final InternalClient services;

    public CorrectionService(CorrectionRepository corrections, InternalClient services) {
        this.corrections = corrections;
        this.services = services;
    }

    /** { platform: { solved, easy… } } with only the fields that were set (admin view adds updatedAt). */
    public Map<String, Map<String, Object>> all(boolean admin) {
        Map<String, Map<String, Object>> out = new LinkedHashMap<>();
        for (Correction c : corrections.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            if (c.getSolved() != null) m.put("solved", c.getSolved());
            if (c.getEasy() != null) m.put("easy", c.getEasy());
            if (c.getMedium() != null) m.put("medium", c.getMedium());
            if (c.getHard() != null) m.put("hard", c.getHard());
            if (admin && c.getUpdatedAt() != null) m.put("updatedAt", c.getUpdatedAt());
            out.put(c.getId(), m);
        }
        return out;
    }

    public void set(String platform, JsonNode body, String admin) {
        check(platform);
        Correction c = CorrectionValidator.clean(body);
        if (CorrectionValidator.empty(c)) {
            corrections.deleteById(platform);
        } else {
            c.setId(platform);
            c.setUpdatedAt(new Date());
            corrections.save(c);
        }
        log.info("Coding numbers corrected: {} by {}", platform, admin);
        services.contentChanged();
    }

    public void clear(String platform, String admin) {
        check(platform);
        corrections.deleteById(platform);
        log.info("Coding corrections cleared: {} by {}", platform, admin);
        services.contentChanged();
    }

    private static void check(String platform) {
        if (!CorrectionValidator.PLATFORMS.contains(platform)) {
            throw ApiException.badRequest("Unknown platform");
        }
    }
}
