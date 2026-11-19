package com.guruprasad.portfolio.auth;

import com.guruprasad.portfolio.auth.security.PasswordHasher;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordHasherTest {

    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void acceptsHashesMadeByTheNodeScript() {
        // made by scripts/admin.mjs (npm run admin:user) for "correct horse battery staple"
        String node = "scrypt$16384$3wQhvA45cpsjj9nyP4W3Ig==$9TnHFLbIWrNIZ5iJ1Ouf2BIXY2qz5YmII5TQrzWfIzhSsZ60mArQrcW8lJDZPMKYu7VUQor4YUTIeoEgXVcvkg==";
        assertTrue(hasher.matches("correct horse battery staple", node));
        assertFalse(hasher.matches("correct horse battery stapl", node));
    }

    @Test
    void roundTrip() {
        String h = hasher.hash("a long passphrase 123");
        assertTrue(h.startsWith("scrypt$16384$"));
        assertTrue(hasher.matches("a long passphrase 123", h));
        assertFalse(hasher.matches("a long passphrase 124", h));
    }

    @Test
    void rejectsBrokenOrWeakHashes() {
        assertFalse(hasher.matches("x", null));
        assertFalse(hasher.matches("x", "plain-text"));
        assertFalse(hasher.matches("x", "scrypt$2$AAAA$AAAA")); // N too small to be safe
        assertFalse(hasher.matches("", PasswordHasher.DUMMY));
    }
}
