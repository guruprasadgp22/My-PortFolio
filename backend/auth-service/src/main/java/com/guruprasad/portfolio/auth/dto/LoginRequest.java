package com.guruprasad.portfolio.auth.dto;

/** Sign-in form. Anything that isn't a string (e.g. {"$ne": null}) is rejected before it reaches the database. */
public record LoginRequest(Object username, Object password) {
}
