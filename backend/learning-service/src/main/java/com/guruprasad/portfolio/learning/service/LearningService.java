package com.guruprasad.portfolio.learning.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.learning.entity.Course;
import com.guruprasad.portfolio.learning.repository.CourseRepository;
import com.guruprasad.portfolio.learning.validation.CourseValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Courses on the Learning page: add, edit progress, remove, and the one-time import of the built-in courses. */
@Service
public class LearningService {

    private static final Logger log = LoggerFactory.getLogger(LearningService.class);

    private final CourseRepository courses;
    private final MongoTemplate mongo;
    private final InternalClient services;
    private final PlaylistService playlists;

    public LearningService(CourseRepository courses, MongoTemplate mongo, InternalClient services, PlaylistService playlists) {
        this.courses = courses;
        this.mongo = mongo;
        this.services = services;
        this.playlists = playlists;
    }

    /** In page order. The public view is what the site shows; the admin view adds when each was last changed. */
    public List<Map<String, Object>> list(boolean admin) {
        return courses.inPageOrder().stream().map(c -> view(c, admin)).toList();
    }

    private static Map<String, Object> view(Course c, boolean admin) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("list", c.getId());
        m.put("title", c.getTitle());
        m.put("sub", c.getSub());
        m.put("group", c.getGroup());
        m.put("done", c.getDone());
        m.put("count", c.getCount());
        m.put("order", c.getOrder());
        m.put("focus", c.getFocus() == null ? List.of() : c.getFocus());
        if (admin) {
            m.put("updatedAt", c.getUpdatedAt());
        }
        m.values().removeIf(v -> v == null);
        return m;
    }

    public String add(JsonNode body, String admin) {
        String list = CourseValidator.playlistId(body == null ? null : body.get("list"));
        if (list == null) {
            throw ApiException.badRequest("Paste the YouTube playlist link (or its id)");
        }
        Map<String, Object> v = CourseValidator.clean(body, false);
        if (courses.existsById(list)) {
            throw ApiException.conflict("That playlist is already on the page");
        }
        Course c = fromFields(list, v);
        if (c.getOrder() == null) {
            c.setOrder((int) courses.countByGroup(c.getGroup()));
        }
        if (c.getFocus() == null) {
            c.setFocus(List.of());
        }
        if (c.getSub() == null) {
            c.setSub("");
        }
        courses.insert(c);
        log.info("Course added: {} by {}", list, admin);
        changed();
        return list;
    }

    public int importBuiltIn(JsonNode body, String admin) {
        if (courses.count() > 0) {
            throw ApiException.conflict("There are already courses in the database");
        }
        JsonNode list = body == null ? null : body.get("courses");
        List<Course> docs = new ArrayList<>();
        if (list != null && list.isArray()) {
            for (int i = 0; i < Math.min(list.size(), 50); i++) {
                JsonNode t = list.get(i);
                String id = CourseValidator.playlistId(t.get("list"));
                Map<String, Object> v;
                try {
                    v = CourseValidator.clean(t, false);
                } catch (ApiException e) {
                    throw ApiException.badRequest("Course " + (i + 1) + ": " + e.getMessage());
                }
                if (id == null) {
                    throw ApiException.badRequest("Course " + (i + 1) + ": bad playlist id");
                }
                Course c = fromFields(id, v);
                if (c.getOrder() == null) {
                    c.setOrder(i);
                }
                docs.add(c);
            }
        }
        if (docs.isEmpty()) {
            throw ApiException.badRequest("Nothing to import");
        }
        courses.insert(docs);
        log.info("Imported {} built-in courses by {}", docs.size(), admin);
        changed();
        return docs.size();
    }

    public void update(String id, JsonNode body, String admin) {
        Map<String, Object> v = CourseValidator.clean(body, true);
        Course cur = courses.findById(id).orElseThrow(() -> ApiException.notFound("Course not found"));
        int done = v.get("done") instanceof Integer d ? d : cur.getDone() == null ? 0 : cur.getDone();
        int count = v.get("count") instanceof Integer c ? c : cur.getCount() == null ? 1 : cur.getCount();
        if (done > count) {
            throw ApiException.badRequest("Lessons done can't be more than the total");
        }
        Update u = new Update().set("updatedAt", new Date());
        v.forEach(u::set);
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)), u, Course.class);
        log.info("Course updated: {} {} by {}", id, v.keySet(), admin);
        changed();
    }

    public void delete(String id, String admin) {
        if (!courses.existsById(id)) {
            throw ApiException.notFound("Course not found");
        }
        courses.deleteById(id);
        log.info("Course removed: {} by {}", id, admin);
        changed();
    }

    private void changed() {
        playlists.forget();
        services.contentChanged();
    }

    @SuppressWarnings("unchecked")
    private static Course fromFields(String id, Map<String, Object> v) {
        Course c = new Course();
        c.setId(id);
        c.setTitle((String) v.get("title"));
        c.setSub((String) v.get("sub"));
        c.setGroup((String) v.get("group"));
        c.setDone((Integer) v.get("done"));
        c.setCount((Integer) v.get("count"));
        c.setOrder((Integer) v.get("order"));
        c.setFocus((List<String>) v.get("focus"));
        c.setUpdatedAt(new Date());
        return c;
    }
}
