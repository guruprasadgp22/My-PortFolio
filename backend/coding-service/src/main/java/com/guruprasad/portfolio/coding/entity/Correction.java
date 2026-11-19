package com.guruprasad.portfolio.coding.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/** Numbers set by hand in the admin page for one platform (collection "coding"); empty fields use the live number. */
@Document("coding")
public class Correction {

    @Id
    private String id;
    private Integer solved;
    private Integer easy;
    private Integer medium;
    private Integer hard;
    private Date updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getSolved() { return solved; }
    public void setSolved(Integer solved) { this.solved = solved; }
    public Integer getEasy() { return easy; }
    public void setEasy(Integer easy) { this.easy = easy; }
    public Integer getMedium() { return medium; }
    public void setMedium(Integer medium) { this.medium = medium; }
    public Integer getHard() { return hard; }
    public void setHard(Integer hard) { this.hard = hard; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
