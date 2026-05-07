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
  public Page<ServiceCatalogResponseDto> getServiceCatalogsByTenant(Pageable pageable) {
    return repository.findByDeletedAtIsNull(pageable)
        .map(this::toDto);
  }

   @Override
  public List<ServiceCatalogResponseDto> getAllByTenant() {
    return repository.findByDeletedAtIsNullOrderByName()
        .stream()
        .map(this::toDto)
        .collect(Collectors.toList());
  }

  @Override
  public ServiceCatalogResponseDto getById(Integer id, Integer userId) {
    ServiceCatalog sc = repository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new RuntimeException("ServiceCatalog not found"));
    return toDto(sc);
  }

  private ServiceCatalogResponseDto toDto(ServiceCatalog sc) {
    ServiceCatalogResponseDto dto = new ServiceCatalogResponseDto();
    dto.setId(sc.getId());
    dto.setName(sc.getName());
    dto.setDescription(sc.getDescription());
    dto.setBasePrice(sc.getDefaultPrice());
    dto.setCreatedBy(sc.getCreatedBy());
    dto.setCreatedAt(sc.getCreatedAt());
    dto.setUpdatedBy(sc.getUpdatedBy());
    dto.setUpdatedAt(sc.getUpdatedAt());
    return dto;
  }
}
