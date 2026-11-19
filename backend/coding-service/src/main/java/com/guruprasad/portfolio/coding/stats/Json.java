package com.guruprasad.portfolio.coding.stats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Small helpers for building the stats JSON the site reads (same shape as the old Node function). */
public final class Json {

    public static final JsonNodeFactory F = JsonNodeFactory.instance;

    private Json() {
    }

    public static ObjectNode obj() {
        return F.objectNode();
    }

    /** The value, or JSON null when it's missing (JavaScript's `x ?? null`). */
    public static JsonNode orNull(JsonNode v) {
        return v == null || v.isMissingNode() ? NullNode.instance : v;
    }

    /** JavaScript's truthiness for a JSON value. */
    public static boolean truthy(JsonNode v) {
        if (v == null || v.isMissingNode() || v.isNull()) {
            return false;
        }
        if (v.isBoolean()) {
            return v.booleanValue();
        }
        if (v.isNumber()) {
            return v.asDouble() != 0 && !Double.isNaN(v.asDouble());
        }
        if (v.isTextual()) {
            return !v.textValue().isEmpty();
        }
        return true;
    }

    /** JavaScript's `+x || 0`. */
    public static double num(JsonNode v) {
        if (v == null || v.isNull() || v.isMissingNode()) {
            return 0;
        }
        if (v.isNumber()) {
            return v.asDouble();
        }
        if (v.isTextual()) {
            try {
                return Double.parseDouble(v.textValue().trim());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    /** A number as JSON: whole numbers stay whole (1485, not 1485.0). */
    public static JsonNode number(double d) {
        return d == Math.rint(d) && Math.abs(d) < 1e15 ? F.numberNode((long) d) : F.numberNode(d);
    }

    /** JavaScript's `+n.toFixed(places)`. */
    public static JsonNode fixed(double d, int places) {
        return number(BigDecimal.valueOf(d).setScale(places, RoundingMode.HALF_UP).doubleValue());
    }

    /** JavaScript's Math.round. */
    public static long round(double d) {
        return (long) Math.floor(d + 0.5);
    }
}
