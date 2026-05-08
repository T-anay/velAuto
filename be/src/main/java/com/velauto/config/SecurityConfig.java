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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
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
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
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

              // 1. ÖNCELİK: Tarayıcının CORS ön kontrol (OPTIONS) isteklerine her zaman izin ver
              auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

              // 2. ÖNCELİK: Temel Auth rotalarını garanti altına al
              auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll();
              auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll();
              auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll();
              auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated();
              auth.requestMatchers(HttpMethod.POST, "/api/public/appointments").permitAll();

              // 3. ÖNCELİK: Diğer kuralları YAML'dan okumaya devam et
              List<SecurityYamlConfig.Endpoint> endpoints = securityYamlConfig.getAllEndpoints();

              if (endpoints != null && !endpoints.isEmpty()) {
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
                      // DÜZELTME BURADA: hasAnyRole yerine hasAnyAuthority kullanıyoruz
                      // ve olası 'ROLE_' krizini önlemek için iki formatı da listeye ekliyoruz
                      String[] authorities = new String[roles.length * 2];
                      for (int i = 0; i < roles.length; i++) {
                        authorities[i * 2] = roles[i];                 // Örn: SUPER_ADMIN
                        authorities[i * 2 + 1] = "ROLE_" + roles[i];   // Örn: ROLE_SUPER_ADMIN
                      }
                      auth.requestMatchers(httpMethod, antPattern).hasAnyAuthority(authorities);
                    }
                  } catch (Exception e) {
                    log.error("Endpoint hatası: {} → {}", endpoint.getPath(), e.getMessage());
                  }
                });
              }

              // Kalan tüm istekler için giriş yapılmış olması zorunlu
              auth.anyRequest().authenticated();
            });

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
    configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
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
