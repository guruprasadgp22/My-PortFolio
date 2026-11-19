package com.guruprasad.portfolio.learning;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class LearningServiceApplication {

    public static void main(String[] args) {
        // settings are in learning-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(LearningServiceApplication.class).properties("spring.config.name=learning-service").run(args);
    }
}
