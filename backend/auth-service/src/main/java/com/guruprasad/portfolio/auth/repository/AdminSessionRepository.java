package com.guruprasad.portfolio.auth.repository;

import com.guruprasad.portfolio.auth.entity.AdminSession;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdminSessionRepository extends MongoRepository<AdminSession, String> {

    void deleteByUser(String user);
}
