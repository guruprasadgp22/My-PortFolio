package com.guruprasad.portfolio.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;

/** The knowledge sheet the assistant answers from (knowledge.json, made by `npm run backend:knowledge`). */
@Component
public class Knowledge {

    public record Sheet(String name, String pronouns, List<String> sections, List<String> projects, String text) {
    }

    private final Sheet sheet;

    public Knowledge(ObjectMapper json) throws IOException {
        try (InputStream in = new ClassPathResource("knowledge.json").getInputStream()) {
            this.sheet = json.readValue(in, Sheet.class);
        }
    }

    public String name() {
        return sheet.name();
    }

    public String pronouns() {
        return sheet.pronouns();
    }

    public List<String> sections() {
        return sheet.sections();
    }

    public Set<String> projectTitles() {
        return Set.copyOf(sheet.projects());
    }

    public String text() {
        return sheet.text();
    }
}
