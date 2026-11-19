package com.guruprasad.portfolio.content.repository;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Collection "sections": { _id: "PROJECTS", data: <the section, as the site's data.js has it>, updatedAt }.
 * Read and written as raw documents on purpose: section content is free-form JSON whose keys can contain dots
 * ("React.js"), which the object mapper refuses. The content is checked by SectionValidator before it gets here.
 */
@Repository
public class SectionRepository {

    private final MongoTemplate mongo;

    public SectionRepository(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    private MongoCollection<Document> sections() {
        return mongo.getCollection("sections");
    }

    public List<Document> findAll() {
        return sections().find().into(new ArrayList<>());
    }

    public void save(String key, Object data) {
        sections().replaceOne(Filters.eq("_id", key), new Document("data", data).append("updatedAt", new Date()), new ReplaceOptions().upsert(true));
    }

    public void delete(String key) {
        sections().deleteOne(Filters.eq("_id", key));
    }

    /** When anything on the site last changed (collection "meta", _id "content"), as an ISO date. */
    public String lastChange() {
        Document d = mongo.getCollection("meta").find(Filters.eq("_id", "content")).first();
        return d == null ? null : d.getString("at");
    }

    public void touch() {
        mongo.getCollection("meta").updateOne(Filters.eq("_id", "content"), Updates.set("at", Instant.now().toString()), new UpdateOptions().upsert(true));
    }
}
