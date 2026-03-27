package com.velauto.service;

import com.velauto.dto.CustomerCreateDto;
import com.velauto.dto.CustomerResponseDto;
import com.velauto.dto.CustomerUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

  CustomerResponseDto createCustomer(CustomerCreateDto request, Integer currentUserId);

  CustomerResponseDto updateCustomer(Integer customerId, CustomerUpdateDto request, Integer currentUserId);

  CustomerResponseDto getCustomerById(Integer customerId);

  CustomerResponseDto getByPhone(String phone);

  Page<CustomerResponseDto> getCustomersByTenant(Integer tenantId, Pageable pageable);

  void deleteCustomer(Integer customerId, Integer currentUserId);
}


