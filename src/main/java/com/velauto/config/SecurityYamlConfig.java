package com.velauto.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@PropertySource(value = "classpath:security.yaml", factory = YamlPropertySourceFactory.class)
@ConfigurationProperties(prefix = "security")
@Data
@Slf4j
public class SecurityYamlConfig {

  @Data
  public static class Endpoint {
    private String path;
    private String method;
    private String description;
    private List<String> roles;

    public boolean isPublic() {
      return roles == null || roles.isEmpty();
    }

    public boolean canAccess(String userRole) {
      if (isPublic()) {
        return true;
      }
      return roles.contains(userRole);
    }

    public String getRolesAsString() {
      if (isPublic()) {
        return "PUBLIC";
      }
      return String.join(", ", roles);
    }
  }

  private List<Endpoint> endpoints;

  @PostConstruct
  public void init() {
    if (endpoints == null || endpoints.isEmpty()) {
      log.error("SecurityYamlConfig boş yüklendi");
    } else {
      log.info("SecurityYamlConfig yüklendi: {} endpoint", endpoints.size());
    }
  }

  public Endpoint getEndpoint(String path, String method) {
    if (endpoints == null || endpoints.isEmpty()) {
      return null;
    }
    return endpoints.stream()
        .filter(e -> pathMatches(e.getPath(), path) && methodMatches(e.getMethod(), method))
        .findFirst()
        .orElse(null);
  }

  public List<String> getRequiredRoles(String path, String method) {
    Endpoint endpoint = getEndpoint(path, method);
    if (endpoint == null) {
      return List.of();
    }
    return endpoint.isPublic() ? List.of() : endpoint.getRoles();
  }

  public boolean isPublicEndpoint(String path, String method) {
    Endpoint endpoint = getEndpoint(path, method);
    return endpoint != null && endpoint.isPublic();
  }

  public boolean canAccessEndpoint(String path, String method, String userRole) {
    Endpoint endpoint = getEndpoint(path, method);
    if (endpoint == null) {
      return false;
    }
    return endpoint.canAccess(userRole);
  }

  public List<Endpoint> getPublicEndpoints() {
    if (endpoints == null) {
      return List.of();
    }
    return endpoints.stream()
        .filter(Endpoint::isPublic)
        .collect(Collectors.toList());
  }

  public List<Endpoint> getAccessibleEndpoints(String userRole) {
    if (endpoints == null) {
      return List.of();
    }
    return endpoints.stream()
        .filter(e -> e.canAccess(userRole))
        .collect(Collectors.toList());
  }

  public List<Endpoint> getAllEndpoints() {
    return endpoints != null ? endpoints : List.of();
  }

  private boolean pathMatches(String pattern, String path) {
    String regex = pattern
        .replace(".", "\\.")
        .replace("*", ".*")
        .replaceAll("\\{[^}]+\\}", "[^/]+");
    return path.matches("^" + regex + "$");
  }

  private boolean methodMatches(String configMethod, String requestMethod) {
    return configMethod == null || configMethod.equalsIgnoreCase(requestMethod);
  }
}

