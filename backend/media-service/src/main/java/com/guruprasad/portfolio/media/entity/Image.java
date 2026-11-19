package com.guruprasad.portfolio.media.entity;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * An uploaded image (collection "images"): the full copy (up to 1600px) and a 640px copy for phones, as WebP or
 * JPEG bytes. Never changes after upload; a new upload gets a new id.
 */
@Document("images")
public class Image {

    @Id
    private ObjectId id;
    private String name;
    private String type;
    private Integer w;
    private Integer h;
    private byte[] full;
    private byte[] small;
    private Integer bytes;
    private Date createdAt;

    public ObjectId getId() { return id; }
    public void setId(ObjectId id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getW() { return w; }
    public void setW(Integer w) { this.w = w; }
    public Integer getH() { return h; }
    public void setH(Integer h) { this.h = h; }
    public byte[] getFull() { return full; }
    public void setFull(byte[] full) { this.full = full; }
    public byte[] getSmall() { return small; }
    public void setSmall(byte[] small) { this.small = small; }
    public Integer getBytes() { return bytes; }
    public void setBytes(Integer bytes) { this.bytes = bytes; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
