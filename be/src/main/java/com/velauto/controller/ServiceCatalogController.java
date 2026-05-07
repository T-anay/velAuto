package com.velauto.controller;

import com.velauto.dto.ServiceCatalogResponseDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/service-catalogs")
@RequiredArgsConstructor
public class ServiceCatalogController {

  private final ServiceCatalogService service;

  @GetMapping
  public ResponseEntity<Page<ServiceCatalogResponseDto>> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) Integer tenantId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Integer tId = tenantId != null ? tenantId : 1;
    Pageable pageable = PageRequest.of(page, size);
    Page<ServiceCatalogResponseDto> result = service.getServiceCatalogsByTenant(pageable);
    return ResponseEntity.ok(result);
  }

  @GetMapping("/all")
  public ResponseEntity<List<ServiceCatalogResponseDto>> listAll(
      @RequestParam(required = false) Integer tenantId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Integer tId = tenantId != null ? tenantId : 1;
    List<ServiceCatalogResponseDto> list = service.getAllByTenant();
    return ResponseEntity.ok(list);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ServiceCatalogResponseDto> getById(
      @org.springframework.web.bind.annotation.PathVariable Integer id,
      @RequestParam(required = false) Integer tenantId,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Integer tId = tenantId != null ? tenantId : 1;
    ServiceCatalogResponseDto dto = service.getById(id, tId);
    return ResponseEntity.ok(dto);
  }
}
