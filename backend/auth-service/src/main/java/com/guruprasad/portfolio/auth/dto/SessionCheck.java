package com.guruprasad.portfolio.auth.dto;

/** What the gateway sends to check a session: the claims from the verified cookie. */
public record SessionCheck(String sid, String user, Integer version) {
}
