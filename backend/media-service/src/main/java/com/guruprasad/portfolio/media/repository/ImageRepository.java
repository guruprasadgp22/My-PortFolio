package com.guruprasad.portfolio.media.repository;

import com.guruprasad.portfolio.media.entity.Image;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ImageRepository extends MongoRepository<Image, ObjectId> {

    /** The image library without the image bytes. */
    @Query(value = "{}", fields = "{ full: 0, small: 0 }", sort = "{ createdAt: -1 }")
    List<Image> library(Pageable page);
}
