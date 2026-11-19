package com.guruprasad.portfolio.gateway;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        // settings are in api-gateway.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(ApiGatewayApplication.class).properties("spring.config.name=api-gateway").run(args);
    }
}
