package com.guruprasad.portfolio.auth.security;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * scrypt password hashes in the same format as scripts/admin.mjs ("scrypt$N$salt$hash", r = 8, p = 1, 64-byte key),
 * so the existing admin password keeps working. scrypt is deliberately slow and memory-hungry: guessing a
 * stolen hash costs an attacker years, not minutes.
 */
@Component
public class PasswordHasher {

    private static final int N = 16384, R = 8, P = 1, KEY_LENGTH = 64;
    // checked when the username is wrong, so a wrong username and a wrong password take the same time
    public static final String DUMMY = "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$"
            + Base64.getEncoder().encodeToString(new byte[KEY_LENGTH]);

    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        byte[] key = SCrypt.generate(password.getBytes(StandardCharsets.UTF_8), salt, N, R, P, KEY_LENGTH);
        Base64.Encoder b64 = Base64.getEncoder();
        return "scrypt$" + N + "$" + b64.encodeToString(salt) + "$" + b64.encodeToString(key);
    }

    public boolean matches(String password, String stored) {
        String[] parts = stored == null ? new String[0] : stored.split("\\$");
        if (parts.length != 4 || !"scrypt".equals(parts[0])) {
            return false;
        }
        try {
            int n = Integer.parseInt(parts[1]);
            if (n < 16384 || n > 1 << 20 || Integer.bitCount(n) != 1) {
                return false;
            }
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] want = Base64.getDecoder().decode(parts[3]);
            byte[] got = SCrypt.generate(password.getBytes(StandardCharsets.UTF_8), salt, n, R, P, want.length);
            return MessageDigest.isEqual(got, want);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
