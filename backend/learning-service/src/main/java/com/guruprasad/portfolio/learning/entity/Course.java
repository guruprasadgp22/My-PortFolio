package com.guruprasad.portfolio.learning.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;
import java.util.List;

/** A course on the Learning page (collection "learning"); its id is the YouTube playlist id. */
@Document("learning")
public class Course {

    @Id
    private String id;
    private String title;
    private String sub;
    private String group;
    private Integer done;
    private Integer count;
    private Integer order;
    private List<String> focus;
    @Field("updatedAt")
    private Date updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSub() { return sub; }
    public void setSub(String sub) { this.sub = sub; }
    public String getGroup() { return group; }
    public void setGroup(String group) { this.group = group; }
    public Integer getDone() { return done; }
    public void setDone(Integer done) { this.done = done; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public List<String> getFocus() { return focus; }
    public void setFocus(List<String> focus) { this.focus = focus; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
