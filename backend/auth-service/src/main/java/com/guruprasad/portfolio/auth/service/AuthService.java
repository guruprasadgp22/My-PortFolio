package com.guruprasad.portfolio.auth.service;

import com.guruprasad.portfolio.auth.entity.AdminAccount;
import com.guruprasad.portfolio.auth.entity.AdminSession;
import com.guruprasad.portfolio.auth.repository.AdminAccountRepository;
import com.guruprasad.portfolio.auth.repository.AdminSessionRepository;
import com.guruprasad.portfolio.auth.security.PasswordHasher;
import com.guruprasad.portfolio.auth.security.SessionTokens;
import com.guruprasad.portfolio.common.web.ApiException;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

/**
 * Sign-in, sign-out, password change and session checks for the admin.
 *   - 5 wrong passwords in a row lock sign-in for 15 minutes (the gateway also limits tries per address).
 *   - Wrong username and wrong password give the same answer and take the same time.
 *   - Every sign-in creates a server-side session; the cookie is useless once it's deleted.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILS = 5;
    private static final Duration LOCK = Duration.ofMinutes(15);
    private static final Duration SEEN_EVERY = Duration.ofMinutes(5);

    private final AdminAccountRepository accounts;
    private final AdminSessionRepository sessions;
    private final PasswordHasher hasher;
    private final SessionTokens tokens;
    private final SecureRandom random = new SecureRandom();

    public AuthService(AdminAccountRepository accounts, AdminSessionRepository sessions, PasswordHasher hasher, SessionTokens tokens) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.hasher = hasher;
        this.tokens = tokens;
    }

    public record SignIn(String user, String token) {
    }

    public SignIn login(Object rawUser, Object rawPassword, String ip, String agent) {
        if (!(rawUser instanceof String u) || !(rawPassword instanceof String p) || u.isBlank() || p.isEmpty()) {
            throw ApiException.badRequest("Send a username and password");
        }
        String username = u.trim().toLowerCase();
        String password = p.length() > 200 ? p.substring(0, 200) : p;
        Optional<AdminAccount> found = username.length() <= 60 ? accounts.findById(username) : Optional.empty();
        AdminAccount user = found.orElse(null);
        long now = System.currentTimeMillis();

        if (user != null && user.getLockUntil() != null && user.getLockUntil() > now) {
            long minutes = Math.max(1, (user.getLockUntil() - now + 59_999) / 60_000);
            log.warn("Sign-in refused while locked: user={} ip={}", username, ip);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong tries. Try again in " + minutes + " min.");
        }

        boolean ok = hasher.matches(password, user != null ? user.getHash() : PasswordHasher.DUMMY);
        if (user == null || !ok) {
            if (user != null) {
                int fails = user.getFails() + 1;
                if (fails >= MAX_FAILS) {
                    user.setFails(0);
                    user.setLockUntil(now + LOCK.toMillis());
                    log.warn("Sign-in locked for {} min after {} wrong passwords: user={} ip={}", LOCK.toMinutes(), MAX_FAILS, username, ip);
                } else {
                    user.setFails(fails);
                }
                accounts.save(user);
            }
            log.warn("Wrong username or password: user={} ip={}", username, ip);
            pause();
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        }

        user.setFails(0);
        user.setLockUntil(null);
        user.setLastLogin(new Date());
        accounts.save(user);
        log.info("Signed in: user={} ip={}", username, ip);
        return new SignIn(user.getId(), newSession(user, ip, agent));
    }

    public void logout(String token) {
        Claims claims = tokens.read(token);
        if (claims != null && claims.getId() != null) {
            sessions.deleteById(claims.getId());
            log.info("Signed out: user={}", claims.getSubject());
        }
    }

    /** True while the session exists, hasn't expired and was made with the current password. */
    public boolean valid(String sid, String user, Integer version) {
        if (sid == null || user == null || version == null) {
            return false;
        }
        Optional<AdminSession> found = sessions.findById(sid);
        if (found.isEmpty()) {
            return false;
        }
        AdminSession s = found.get();
        Date now = new Date();
        if (!s.getUser().equals(user) || s.getVersion() != version || s.getExpiresAt().before(now)) {
            return false;
        }
        AdminAccount account = accounts.findById(user).orElse(null);
        if (account == null || account.getVersion() != version) {
            return false;
        }
        if (s.getLastSeen() == null || now.getTime() - s.getLastSeen().getTime() > SEEN_EVERY.toMillis()) {
            s.setLastSeen(now);
            sessions.save(s);
        }
        return true;
    }

    /** Change the password: needs the current one, ends every session (other devices too) and starts a new one. */
    public SignIn changePassword(String user, Object current, Object next, String ip, String agent) {
        if (!(current instanceof String cur) || !(next instanceof String nxt)) {
            throw ApiException.badRequest("Send the current and the new password");
        }
        AdminAccount account = accounts.findById(user).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (!hasher.matches(cur, account.getHash())) {
            pause();
            throw new ApiException(HttpStatus.FORBIDDEN, "Current password is wrong");
        }
        if (nxt.length() < 12 || nxt.length() > 200) {
            throw ApiException.badRequest("The new password needs 12 to 200 characters");
        }
        if (nxt.toLowerCase().contains(user) || nxt.equals(cur)) {
            throw ApiException.badRequest("Choose a new password that doesn't contain your username");
        }
        account.setHash(hasher.hash(nxt));
        account.setVersion(account.getVersion() + 1);
        accounts.save(account);
        sessions.deleteByUser(user);
        log.info("Password changed, all sessions ended: user={} ip={}", user, ip);
        return new SignIn(user, newSession(account, ip, agent));
    }

    private String newSession(AdminAccount user, String ip, String agent) {
        byte[] id = new byte[32];
        random.nextBytes(id);
        Date now = new Date();
        Date expires = new Date(now.getTime() + SessionTokens.LIFETIME.toMillis());
        AdminSession s = new AdminSession();
        s.setId(Base64.getUrlEncoder().withoutPadding().encodeToString(id));
        s.setUser(user.getId());
        s.setVersion(user.getVersion());
        s.setCreatedAt(now);
        s.setExpiresAt(expires);
        s.setLastSeen(now);
        s.setIp(ip);
        s.setAgent(agent == null ? null : agent.substring(0, Math.min(agent.length(), 200)));
        sessions.save(s);
        return tokens.issue(s.getId(), user.getId(), user.getVersion(), expires);
    }

    // slows down guessing; the lockout and the gateway's rate limit do the real work
    private static void pause() {
        try {
            Thread.sleep(400);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
