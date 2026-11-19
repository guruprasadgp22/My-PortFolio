package com.guruprasad.portfolio.chat;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class ChatServiceApplication {

    public static void main(String[] args) {
        // settings are in chat-service.yml (not application.yml), so several services can share one process (all-in-one)
        new SpringApplicationBuilder(ChatServiceApplication.class).properties("spring.config.name=chat-service").run(args);
    }
}
