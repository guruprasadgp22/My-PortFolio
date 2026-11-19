package com.guruprasad.portfolio.auth;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        // settings are in auth-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(AuthServiceApplication.class).properties("spring.config.name=auth-service").run(args);
    }
}
