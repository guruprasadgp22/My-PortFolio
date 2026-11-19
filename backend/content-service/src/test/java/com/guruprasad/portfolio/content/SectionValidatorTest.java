package com.guruprasad.portfolio.content;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.content.validation.SectionValidator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SectionValidatorTest {

    private final ObjectMapper json = new ObjectMapper();

    private void ok(String key, String data) {
        assertDoesNotThrow(() -> SectionValidator.clean(key, json.readTree(data)));
    }

    private void refused(String key, String data) {
        assertThrows(ApiException.class, () -> SectionValidator.clean(key, json.readTree(data)));
    }

    @Test
    void acceptsNormalContent() {
        ok("SKILLS", "[{\"h\":\"Frontend\",\"s\":[\"React.js\",\"JavaScript\"],\"at\":{\"React.js\":\"Job Board\"}}]");
        ok("ME", "{\"name\":\"Guruprasad\",\"website\":\"https://guruprasadgp.netlify.app\"}");
    }

    @Test
    void refusesScriptLinksAndOperators() {
        refused("PROJECTS", "[{\"url\":\"javascript:alert(1)\"}]");
        refused("PROJECTS", "[{\"url\":\" JaVa\\tScRiPt:alert(1)\"}]");
        refused("PROJECTS", "[{\"url\":\"data:text/html,<script>x</script>\"}]");
        refused("PROJECTS", "[{\"$set\":1}]");
        refused("ME", "{\"__proto__\":{\"admin\":true}}");
        refused("ME", "{\"constructor\":1}");
    }

    @Test
    void refusesWrongShapesAndUnknownSections() {
        refused("ME", "[]");
        refused("PROJECTS", "{}");
        refused("ADMINS", "[]");
        refused("ME", "{\"a\":{\"b\":{\"c\":{\"d\":{\"e\":{\"f\":{\"g\":{\"h\":{\"i\":1}}}}}}}}}");
    }
}
