package com.guruprasad.portfolio.media.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.media.entity.Image;

import java.util.Base64;

/**
 * Uploaded images: WebP or JPEG only, recognised by their first bytes, not by the name or a type the browser claims.
 * SVG is refused on purpose: it can carry script, and images are served from the site's own address.
 * The admin page converts every picture to WebP/JPEG in the browser first, which also drops EXIF data (GPS…).
 */
public final class ImageValidator {

    private static final int MAX_FULL = 3 * 1024 * 1024, MAX_SMALL = 800 * 1024;

    private ImageValidator() {
    }

    public static Image clean(JsonNode b) {
        if (b == null || !b.isObject()) {
            throw ApiException.badRequest("No image received");
        }
        byte[] full = bytes(b.get("full"));
        byte[] small = bytes(b.get("small"));
        if (full == null || full.length == 0) {
            throw ApiException.badRequest("No image received");
        }
        if (full.length > MAX_FULL) {
            throw ApiException.badRequest("Image is too big after compressing (over 3 MB)");
        }
        if (small != null && small.length > MAX_SMALL) {
            throw ApiException.badRequest("Small copy is too big");
        }
        String type = kind(full);
        if (type == null || (small != null && !type.equals(kind(small)))) {
            throw ApiException.badRequest("Only photos and screenshots can be uploaded (PNG, JPG, WebP, GIF)");
        }
        Integer w = size(b.get("w")), h = size(b.get("h"));
        if (w == null || h == null) {
            throw ApiException.badRequest("Missing image size");
        }
        String name = b.path("name").isTextual() ? b.get("name").textValue().strip() : "";
        name = name.replaceAll("[\\x00-\\x1f<>\"'`]", "");
        Image img = new Image();
        img.setName(name.isEmpty() ? "image" : name.substring(0, Math.min(120, name.length())));
        img.setType(type);
        img.setW(w);
        img.setH(h);
        img.setFull(full);
        img.setSmall(small);
        img.setBytes(full.length);
        return img;
    }

    private static byte[] bytes(JsonNode v) {
        if (v == null || !v.isTextual() || v.textValue().isEmpty()) {
            return null;
        }
        try {
            return Base64.getMimeDecoder().decode(v.textValue());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("The image data is damaged");
        }
    }

    static String kind(byte[] b) {
        if (b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        if (b.length > 3 && (b[0] & 0xff) == 0xff && (b[1] & 0xff) == 0xd8 && (b[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        return null;
    }

    private static Integer size(JsonNode v) {
        if (v == null || !v.isNumber() || v.asDouble() != Math.rint(v.asDouble())) {
            return null;
        }
        int n = v.asInt();
        return n >= 1 && n <= 10000 ? n : null;
    }
}
