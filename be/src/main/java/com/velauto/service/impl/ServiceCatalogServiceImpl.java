package com.velauto.service.impl;

import com.velauto.dto.ServiceCatalogResponseDto;
import com.velauto.entity.ServiceCatalog;
import com.velauto.repository.ServiceCatalogRepository;
import com.velauto.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCatalogServiceImpl implements ServiceCatalogService {

  private final ServiceCatalogRepository repository;

  @Override
  public Page<ServiceCatalogResponseDto> getServiceCatalogsByTenant(Integer tenantId, Pageable pageable) {
    return repository.findByTenantId(tenantId, pageable)
        .map(this::toDto);
  }

  @Override
  public List<ServiceCatalogResponseDto> getAllByTenant(Integer tenantId) {
    return repository.findByTenantId(tenantId)
        .stream()
        .map(this::toDto)
        .collect(Collectors.toList());
  }

  @Override
  public ServiceCatalogResponseDto getById(Integer id, Integer tenantId) {
    ServiceCatalog sc = repository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new RuntimeException("ServiceCatalog not found"));
    return toDto(sc);
  }

  private ServiceCatalogResponseDto toDto(ServiceCatalog sc) {
    ServiceCatalogResponseDto dto = new ServiceCatalogResponseDto();
    dto.setId(sc.getId());
    dto.setName(sc.getName());
    dto.setDescription(sc.getDescription());
    dto.setBasePrice(sc.getDefaultPrice());
    dto.setTenantId(sc.getTenantId());
    dto.setCreatedBy(sc.getCreatedBy());
    dto.setCreatedAt(sc.getCreatedAt());
    dto.setUpdatedBy(sc.getUpdatedBy());
    dto.setUpdatedAt(sc.getUpdatedAt());
    return dto;
  }
}
