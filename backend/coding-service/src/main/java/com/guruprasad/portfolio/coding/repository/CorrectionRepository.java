package com.guruprasad.portfolio.coding.repository;

import com.guruprasad.portfolio.coding.entity.Correction;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CorrectionRepository extends MongoRepository<Correction, String> {
}
