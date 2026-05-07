package com.velauto.service;

import com.velauto.dto.ServiceCatalogResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ServiceCatalogService {

  Page<ServiceCatalogResponseDto> getServiceCatalogsByTenant(Pageable pageable);

  List<ServiceCatalogResponseDto> getAllByTenant();

  ServiceCatalogResponseDto getById(Integer id, Integer userId);
}
