package com.guruprasad.portfolio.coding;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class CodingServiceApplication {

    public static void main(String[] args) {
        // settings are in coding-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(CodingServiceApplication.class).properties("spring.config.name=coding-service").run(args);
    }
}
