package com.guruprasad.portfolio.learning.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.web.ApiException;

/** A whole number in range from a form field (a number or a numeric string); null when it's empty. */
final class Numbers {

    private Numbers() {
    }

    static Integer whole(JsonNode v, int min, int max, String name) {
        if (v == null || v.isNull() || (v.isTextual() && v.textValue().isBlank())) {
            return null;
        }
        double d;
        if (v.isNumber()) {
            d = v.asDouble();
        } else if (v.isTextual()) {
            try {
                d = Double.parseDouble(v.textValue().trim());
            } catch (NumberFormatException e) {
                throw ApiException.badRequest(name + " must be a whole number");
            }
        } else {
            throw ApiException.badRequest(name + " must be a whole number");
        }
        if (d != Math.rint(d) || d < min || d > max) {
            throw ApiException.badRequest(name + " must be a whole number");
        }
        return (int) d;
    }
}
