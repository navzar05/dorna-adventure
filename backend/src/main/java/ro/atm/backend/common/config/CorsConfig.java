package ro.atm.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // ---------------------------------------------------------------------
        // 1. SPECIFIC CONFIG: Allow ALL origins for the Verify Endpoint
        // ---------------------------------------------------------------------
        CorsConfiguration publicConfig = new CorsConfiguration();

        // Allow connections from anywhere (e.g., mobile devices, email clients)
        publicConfig.setAllowedOrigins(List.of("*"));

        // Only GET is usually needed for verification links
        publicConfig.setAllowedMethods(Arrays.asList("GET", "OPTIONS"));
        publicConfig.setAllowedHeaders(Arrays.asList("*"));

        // IMPORTANT: When using "*" for origins, AllowCredentials must be FALSE
        publicConfig.setAllowCredentials(false);

        // Register this rule for the specific endpoint
        // Make sure this path matches your Controller endpoint exactly
        source.registerCorsConfiguration("/api/auth/verify", publicConfig);


        // ---------------------------------------------------------------------
        // 2. GLOBAL CONFIG: Strict rules for the rest of the application
        // ---------------------------------------------------------------------
        CorsConfiguration globalConfig = new CorsConfiguration();

        globalConfig.setAllowedOrigins(List.of(
                "http://localhost:5174",
                "http://188.25.208.32:6969",
                "https://frontend-production-cca2.up.railway.app",
                "https://www.dorna-adventure.org"
        ));

        globalConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        globalConfig.setAllowedHeaders(Arrays.asList("*"));
        globalConfig.setAllowCredentials(true);
        globalConfig.setMaxAge(3600L);

        // Register this rule for everything else ("/**")
        source.registerCorsConfiguration("/**", globalConfig);

        return source;
    }
}