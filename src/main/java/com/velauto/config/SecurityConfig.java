package com.velauto.config;

import com.velauto.constant.Messages;
import com.velauto.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final SecurityYamlConfig securityYamlConfig;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(exception -> exception
            .authenticationEntryPoint((request, response, authException) -> {
                  response.setContentType("application/json;charset=UTF-8");
                  response.setStatus(401);
                  response.getWriter().write(String.format("{\"error\": \"Yetkisiz\", \"message\": \"%s\"}", Messages.UNAUTHORIZED));
                })
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                  response.setContentType("application/json;charset=UTF-8");
                  response.setStatus(403);
                  response.getWriter().write(String.format("{\"error\": \"Erişim Reddedildi\", \"message\": \"%s\"}", Messages.ACCESS_DENIED));
                })
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> {
          List<SecurityYamlConfig.Endpoint> endpoints = securityYamlConfig.getAllEndpoints();

          if (endpoints == null || endpoints.isEmpty()) {
            auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/forgot-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/appointments/public/*/book").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/admin/create").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/staff/create").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/change-password").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated()
                .anyRequest().authenticated();
          } else {
            endpoints.forEach(endpoint -> {
              try {
                String antPattern = endpoint.getPath()
                    .replaceAll("\\{[^}]+\\}", "*");

                String method = endpoint.getMethod() != null ? endpoint.getMethod() : "POST";
                String[] roles = endpoint.getRoles() != null && !endpoint.getRoles().isEmpty()
                    ? endpoint.getRoles().toArray(new String[0])
                    : new String[0];

                HttpMethod httpMethod = HttpMethod.valueOf(method);

                if (roles.length == 0) {
                  auth.requestMatchers(httpMethod, antPattern).permitAll();
                } else {
                  auth.requestMatchers(httpMethod, antPattern).hasAnyRole(roles);
                }
              } catch (Exception e) {
                log.error("Endpoint hatası: {} → {}", endpoint.getPath(), e.getMessage());
              }
            });

            auth.anyRequest().authenticated();
          }
        });

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
    return authConfig.getAuthenticationManager();
  }
}