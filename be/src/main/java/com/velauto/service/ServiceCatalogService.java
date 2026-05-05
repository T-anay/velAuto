package com.velauto.service;

import com.velauto.dto.ServiceCatalogResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ServiceCatalogService {

  Page<ServiceCatalogResponseDto> getServiceCatalogsByTenant(Integer tenantId, Pageable pageable);

  List<ServiceCatalogResponseDto> getAllByTenant(Integer tenantId);

  ServiceCatalogResponseDto getById(Integer id, Integer tenantId);
}
