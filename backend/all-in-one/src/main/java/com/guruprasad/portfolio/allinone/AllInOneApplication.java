package com.guruprasad.portfolio.allinone;

import com.guruprasad.portfolio.auth.AuthServiceApplication;
import com.guruprasad.portfolio.chat.ChatServiceApplication;
import com.guruprasad.portfolio.coding.CodingServiceApplication;
import com.guruprasad.portfolio.contest.ContestServiceApplication;
import com.guruprasad.portfolio.content.ContentServiceApplication;
import com.guruprasad.portfolio.gateway.ApiGatewayApplication;
import com.guruprasad.portfolio.learning.LearningServiceApplication;
import com.guruprasad.portfolio.media.MediaServiceApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Every service in one Java process, for hosts too small for one machine per service (Render's free plan, 512 MB).
 * Each service still runs as its own Spring application with its own port, settings, database collections and
 * security; only the machine is shared.
 *   - the services listen on 127.0.0.1 only, so nothing outside this machine can reach them; the gateway listens on
 *     $PORT and is the one way in, exactly as in the Docker Compose setup
 *   - no Eureka: the services find each other at their fixed local ports (Spring Cloud's simple discovery)
 *   - chat-service only starts when ANTHROPIC_API_KEY is set (without it the site uses its offline answers)
 */
public final class AllInOneApplication {

    private static final Logger log = LoggerFactory.getLogger(AllInOneApplication.class);

    private record Service(String name, Class<?> app, int port) {
    }

    public static void main(String[] args) {
        List<Service> services = new ArrayList<>(List.of(
                new Service("auth-service", AuthServiceApplication.class, 8081),
                new Service("content-service", ContentServiceApplication.class, 8082),
                new Service("learning-service", LearningServiceApplication.class, 8083),
                new Service("coding-service", CodingServiceApplication.class, 8084),
                new Service("contest-service", ContestServiceApplication.class, 8085),
                new Service("media-service", MediaServiceApplication.class, 8086)));
        String chatKey = System.getenv("ANTHROPIC_API_KEY");
        if (chatKey != null && !chatKey.isBlank()) {
            services.add(new Service("chat-service", ChatServiceApplication.class, 8087));
        }

        // where each service is, for every service (and the gateway) to find the others
        Map<String, String> shared = new LinkedHashMap<>();
        shared.put("eureka.client.enabled", "false");
        shared.put("spring.cloud.discovery.client.simple.local.service-id", "all-in-one");
        for (Service s : services) {
            shared.put("spring.cloud.discovery.client.simple.instances." + s.name() + "[0].uri", "http://127.0.0.1:" + s.port());
        }

        long started = System.currentTimeMillis();
        for (Service s : services) {
            Map<String, String> own = new LinkedHashMap<>(shared);
            own.put("spring.config.name", s.name());
            own.put("server.port", String.valueOf(s.port()));
            own.put("server.address", "127.0.0.1");
            // the gateway's code is on the classpath too; it only runs in the gateway's own application
            own.put("spring.cloud.gateway.server.webflux.enabled", "false");
            run(s.app(), WebApplicationType.SERVLET, own, args);
            log.info("{} ready on 127.0.0.1:{}", s.name(), s.port());
        }

        Map<String, String> gateway = new LinkedHashMap<>(shared);
        gateway.put("spring.config.name", "api-gateway");
        gateway.put("server.port", System.getenv().getOrDefault("PORT", "8080"));
        gateway.put("spring.autoconfigure.exclude", String.join(",",
                "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration",
                "org.springframework.boot.autoconfigure.mongo.MongoReactiveAutoConfiguration",
                "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration",
                "org.springframework.boot.autoconfigure.data.mongo.MongoReactiveDataAutoConfiguration",
                "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration",
                "org.springframework.boot.autoconfigure.data.mongo.MongoReactiveRepositoriesAutoConfiguration"));
        run(ApiGatewayApplication.class, WebApplicationType.REACTIVE, gateway, args);
        log.info("All {} services and the gateway are up in {} s (gateway on port {})", services.size(),
                (System.currentTimeMillis() - started) / 1000, gateway.get("server.port"));
    }

    // settings go in as command-line arguments, so they win over each service's own yml (e.g. its port)
    private static void run(Class<?> app, WebApplicationType type, Map<String, String> settings, String[] args) {
        List<String> all = new ArrayList<>(Arrays.asList(args));
        settings.forEach((k, v) -> all.add("--" + k + "=" + v));
        new SpringApplicationBuilder(app).web(type).run(all.toArray(String[]::new));
    }
}
