package com.guruprasad.portfolio.contest.entity;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/** A contest added by hand (collection "contests"), for platforms without a live API. date is "YYYY-MM-DD". */
@Document("contests")
public class Contest {

    @Id
    private ObjectId id;
    private String platform;
    private String name;
    private String date;
    private Integer rank;
    private Integer players;
    private Integer solved;
    private Integer of;
    private Integer rating;
    private String url;
    private Date updatedAt;

    public ObjectId getId() { return id; }
    public void setId(ObjectId id) { this.id = id; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
    public Integer getPlayers() { return players; }
    public void setPlayers(Integer players) { this.players = players; }
    public Integer getSolved() { return solved; }
    public void setSolved(Integer solved) { this.solved = solved; }
    public Integer getOf() { return of; }
    public void setOf(Integer of) { this.of = of; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
