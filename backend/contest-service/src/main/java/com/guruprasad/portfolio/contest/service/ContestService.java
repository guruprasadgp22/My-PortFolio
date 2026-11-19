package com.guruprasad.portfolio.contest.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.contest.entity.Contest;
import com.guruprasad.portfolio.contest.repository.ContestRepository;
import com.guruprasad.portfolio.contest.validation.ContestValidator;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ContestService {

    private static final Logger log = LoggerFactory.getLogger(ContestService.class);

    private final ContestRepository contests;
    private final InternalClient services;

    public ContestService(ContestRepository contests, InternalClient services) {
        this.contests = contests;
        this.services = services;
    }

    /** Public view: oldest first, at most 500. Admin view: newest first, with when each was changed. */
    public List<Map<String, Object>> list(boolean admin) {
        Sort sort = admin ? Sort.by(Sort.Direction.DESC, "date") : Sort.by("date");
        return contests.findAll(PageRequest.of(0, 500, sort)).stream().map(c -> view(c, admin)).toList();
    }

    private static Map<String, Object> view(Contest c, boolean admin) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId().toHexString());
        m.put("platform", c.getPlatform());
        m.put("name", c.getName());
        m.put("date", c.getDate());
        m.put("rank", c.getRank());
        m.put("players", c.getPlayers());
        m.put("solved", c.getSolved());
        m.put("of", c.getOf());
        m.put("rating", c.getRating());
        m.put("url", c.getUrl());
        if (admin) {
            m.put("updatedAt", c.getUpdatedAt());
        }
        return m;
    }

    public String add(JsonNode body, String admin) {
        Contest c = ContestValidator.clean(body);
        c.setUpdatedAt(new Date());
        Contest saved = contests.insert(c);
        log.info("Contest added: {} {} by {}", c.getPlatform(), c.getName(), admin);
        services.contentChanged();
        return saved.getId().toHexString();
    }

    public void update(String id, JsonNode body, String admin) {
        ObjectId oid = parse(id);
        Contest c = ContestValidator.clean(body);
        if (!contests.existsById(oid)) {
            throw ApiException.notFound("Contest not found");
        }
        c.setId(oid);
        c.setUpdatedAt(new Date());
        contests.save(c);
        log.info("Contest updated: {} by {}", id, admin);
        services.contentChanged();
    }

    public void delete(String id, String admin) {
        ObjectId oid = parse(id);
        if (!contests.existsById(oid)) {
            throw ApiException.notFound("Contest not found");
        }
        contests.deleteById(oid);
        log.info("Contest removed: {} by {}", id, admin);
        services.contentChanged();
    }

    private static ObjectId parse(String id) {
        if (!ObjectId.isValid(id)) {
            throw ApiException.notFound("Contest not found");
        }
        return new ObjectId(id);
    }
}
