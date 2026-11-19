package com.guruprasad.portfolio.auth.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * The one admin who can edit the site (collection "admins", created with `npm run admin:user`).
 *   hash       scrypt hash "scrypt$N$salt$hash", never the password
 *   version    bumped when the password changes, which ends every session
 *   fails / lockUntil   wrong passwords in a row, and until when (epoch ms) sign-in is locked
 */
@Document("admins")
public class AdminAccount {

    @Id
    private String id;
    private String hash;
    private Integer version;
    private Integer fails;
    private Long lockUntil;
    private Date lastLogin;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    public int getVersion() { return version == null ? 0 : version; }
    public void setVersion(Integer version) { this.version = version; }
    public int getFails() { return fails == null ? 0 : fails; }
    public void setFails(Integer fails) { this.fails = fails; }
    public Long getLockUntil() { return lockUntil; }
    public void setLockUntil(Long lockUntil) { this.lockUntil = lockUntil; }
    public Date getLastLogin() { return lastLogin; }
    public void setLastLogin(Date lastLogin) { this.lastLogin = lastLogin; }
}
