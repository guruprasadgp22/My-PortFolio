package com.guruprasad.portfolio.common;

import com.guruprasad.portfolio.common.client.InternalClient;
import com.guruprasad.portfolio.common.security.InternalAuthFilter;
import com.guruprasad.portfolio.common.web.GlobalExceptionHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.apache.catalina.valves.ErrorReportValve;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.Ordered;
import org.springframework.web.client.RestClient;

/** Switched on in every service that depends on common (see META-INF/spring/…AutoConfiguration.imports). */
@AutoConfiguration
@Import(GlobalExceptionHandler.class)
public class CommonAutoConfiguration {

    private final String token;

    public CommonAutoConfiguration(@Value("${portfolio.internal-token}") String token) {
        if (token == null || token.length() < 32) {
            throw new IllegalStateException("INTERNAL_TOKEN must be set to at least 32 random characters");
        }
        this.token = token;
    }

    @Bean
    public FilterRegistrationBean<InternalAuthFilter> internalAuthFilter() {
        FilterRegistrationBean<InternalAuthFilter> bean = new FilterRegistrationBean<>(new InternalAuthFilter(token));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        bean.addUrlPatterns("/*");
        return bean;
    }

    /** Tomcat's own error pages (for requests rejected before Spring sees them) show no report and no server name. */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> quietTomcatErrors() {
        return factory -> factory.addContextCustomizers(context -> {
            ErrorReportValve valve = new ErrorReportValve();
            valve.setShowReport(false);
            valve.setShowServerInfo(false);
            context.getParent().getPipeline().addValve(valve);
        });
    }

    @Bean
    @LoadBalanced
    public RestClient.Builder loadBalancedRestClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    public InternalClient internalClient(@LoadBalanced RestClient.Builder builder) {
        return new InternalClient(builder, token);
    }
}
