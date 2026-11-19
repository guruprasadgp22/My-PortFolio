package com.guruprasad.portfolio.gateway;

import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableScheduling
public class GatewayConfig {

    /**
     * Always Netty, even when Tomcat is on the classpath too (all-in-one), so every request reaches the gateway's own
     * checks (Tomcat would answer some odd URLs itself, before them).
     */
    @Bean
    public NettyReactiveWebServerFactory nettyReactiveWebServerFactory() {
        return new NettyReactiveWebServerFactory();
    }

    /** Finds services by their Eureka name, e.g. http://auth-service. */
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClient() {
        return WebClient.builder();
    }
}
