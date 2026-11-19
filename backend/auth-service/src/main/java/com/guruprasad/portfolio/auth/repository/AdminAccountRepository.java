package com.guruprasad.portfolio.auth.repository;

import com.guruprasad.portfolio.auth.entity.AdminAccount;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdminAccountRepository extends MongoRepository<AdminAccount, String> {
}
