package com.guruprasad.portfolio.auth.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * One signed-in browser (collection "sessions"). The cookie only carries a signed reference to this record, so
 * signing out, changing the password or deleting the record ends the session at once, even if the cookie was
 * copied. MongoDB deletes records by itself when they expire (TTL index on expiresAt).
 */
@Document("sessions")
public class AdminSession {

    @Id
    private String id;
    @Indexed
    private String user;
    private int version;
    private Date createdAt;
    @Indexed(expireAfter = "0s")
    private Date expiresAt;
    private Date lastSeen;
    private String ip;
    private String agent;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public Date getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Date expiresAt) { this.expiresAt = expiresAt; }
    public Date getLastSeen() { return lastSeen; }
    public void setLastSeen(Date lastSeen) { this.lastSeen = lastSeen; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getAgent() { return agent; }
    public void setAgent(String agent) { this.agent = agent; }
}
