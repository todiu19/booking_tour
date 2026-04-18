package com.project.bookingtour.security;

import com.project.bookingtour.config.AuthCookieProperties;
import com.project.bookingtour.config.CorsProperties;
import com.project.bookingtour.config.JwtProperties;
import com.project.bookingtour.config.VnpayProperties;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties({
    JwtProperties.class,
    AuthCookieProperties.class,
    CorsProperties.class,
    VnpayProperties.class
})
@RequiredArgsConstructor
public class SecurityConfig {

    private final JsonAuthEntryPoint jsonAuthEntryPoint;
    private final JsonAccessDeniedHandler jsonAccessDeniedHandler;
    private final CorsProperties corsProperties;

    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtService jwtService,
            AppUserDetailsService appUserDetailsService,
            AuthCookieProperties authCookieProperties) {
        return new JwtAuthenticationFilter(jwtService, appUserDetailsService, authCookieProperties);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers("/auth/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/home", "/home/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/tours", "/tours/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/destinations", "/destinations/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/reviews", "/reviews/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/payments/vnpay/ipn")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/me")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.POST, "/bookings")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.GET, "/bookings/me")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.PUT, "/bookings/*/cancel")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.POST, "/payments")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.POST, "/reviews")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.GET, "/invoices/me/**")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.PUT, "/update")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.PUT, "/password")
                                        .authenticated()
                                        .requestMatchers("/admin/**", "/dashboard")
                                        .hasRole("admin")
                                        .anyRequest()
                                        .authenticated())
                .exceptionHandling(
                        e ->
                                e.authenticationEntryPoint(jsonAuthEntryPoint)
                                        .accessDeniedHandler(jsonAccessDeniedHandler))
                .addFilterBefore(
                        jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> originPatterns = corsProperties.allowedOrigins();
        if (originPatterns == null || originPatterns.isEmpty()) {
            config.addAllowedOriginPattern("*");
            config.setAllowCredentials(false);
        } else {
            config.setAllowedOriginPatterns(originPatterns);
            config.setAllowCredentials(true);
        }
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Set-Cookie"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
