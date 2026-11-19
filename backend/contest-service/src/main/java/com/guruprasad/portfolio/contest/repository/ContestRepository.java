package com.guruprasad.portfolio.contest.repository;

import com.guruprasad.portfolio.contest.entity.Contest;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContestRepository extends MongoRepository<Contest, ObjectId> {
}
