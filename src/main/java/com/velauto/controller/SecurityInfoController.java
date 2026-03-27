package com.velauto.controller;

import com.velauto.config.SecurityYamlConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/security-info")
@RequiredArgsConstructor
public class SecurityInfoController {

  private final SecurityYamlConfig securityYamlConfig;

  @GetMapping("/all-endpoints")
  public ResponseEntity<Map<String, Object>> getAllEndpoints() {
    Map<String, Object> response = new HashMap<>();
    response.put("description", "Tüm tanımlı endpoint'ler");
    response.put("total_count", securityYamlConfig.getAllEndpoints().size());

    List<?> endpoints = securityYamlConfig.getAllEndpoints().stream()
        .map(e -> Map.of(
            "path", e.getPath(),
            "method", e.getMethod() != null ? e.getMethod() : "ALL",
            "description", e.getDescription(),
            "roles", e.getRolesAsString(),
            "is_public", e.isPublic()
        ))
        .toList();

    response.put("endpoints", endpoints);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/public-endpoints")
  public ResponseEntity<Map<String, Object>> getPublicEndpoints() {
    Map<String, Object> response = new HashMap<>();
    response.put("description", "Herkese açık endpoint'ler");
    response.put("count", securityYamlConfig.getPublicEndpoints().size());

    List<?> endpoints = securityYamlConfig.getPublicEndpoints().stream()
        .map(e -> Map.of(
            "path", e.getPath(),
            "method", e.getMethod(),
            "description", e.getDescription()
        ))
        .toList();

    response.put("endpoints", endpoints);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/endpoints-by-role")
  public ResponseEntity<Map<String, Object>> getEndpointsByRole(@RequestParam String role) {
    Map<String, Object> response = new HashMap<>();
    response.put("description", role + " rolünün erişebildiği endpoint'ler");

    List<SecurityYamlConfig.Endpoint> accessibleEndpoints = securityYamlConfig.getAccessibleEndpoints(role);
    response.put("count", accessibleEndpoints.size());

    List<?> endpoints = accessibleEndpoints.stream()
        .map(e -> Map.of(
            "path", e.getPath(),
            "method", e.getMethod(),
            "description", e.getDescription()
        ))
        .toList();

    response.put("endpoints", endpoints);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/check-access")
  public ResponseEntity<Map<String, Object>> checkAccess(
      @RequestParam String path,
      @RequestParam(defaultValue = "POST") String method) {

    Map<String, Object> response = new HashMap<>();
    response.put("path", path);
    response.put("method", method);

    List<String> requiredRoles = securityYamlConfig.getRequiredRoles(path, method);

    if (requiredRoles.isEmpty()) {
      response.put("access", "PUBLIC");
      response.put("description", "Herkese açık - Auth gerekli değil");
      response.put("required_roles", "NONE");
    } else {
      response.put("access", "ROLE_BASED");
      response.put("description", "Rol-tabanlı erişim");
      response.put("required_roles", requiredRoles);
    }

    return ResponseEntity.ok(response);
  }

  @GetMapping("/can-access")
  public ResponseEntity<Map<String, Object>> canAccess(
      @RequestParam String path,
      @RequestParam(defaultValue = "POST") String method,
      @RequestParam String role) {

    Map<String, Object> response = new HashMap<>();
    response.put("path", path);
    response.put("method", method);
    response.put("role", role);

    boolean canAccess = securityYamlConfig.canAccessEndpoint(path, method, role);
    response.put("can_access", canAccess);
    response.put("result", canAccess ? "✅ ERIŞIM ONAYLANDI" : "❌ ERİŞİM RETTEDİLDİ");

    return ResponseEntity.ok(response);
  }
}

