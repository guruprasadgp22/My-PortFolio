package com.guruprasad.portfolio.content;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class ContentServiceApplication {

    public static void main(String[] args) {
        // settings are in content-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(ContentServiceApplication.class).properties("spring.config.name=content-service").run(args);
    }
}
