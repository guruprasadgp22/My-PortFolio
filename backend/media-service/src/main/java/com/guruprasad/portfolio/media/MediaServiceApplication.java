package com.guruprasad.portfolio.media;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class MediaServiceApplication {

    public static void main(String[] args) {
        // settings are in media-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(MediaServiceApplication.class).properties("spring.config.name=media-service").run(args);
    }
}
