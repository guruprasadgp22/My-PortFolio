package com.guruprasad.portfolio.contest;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class ContestServiceApplication {

    public static void main(String[] args) {
        // settings are in contest-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(ContestServiceApplication.class).properties("spring.config.name=contest-service").run(args);
    }
}
