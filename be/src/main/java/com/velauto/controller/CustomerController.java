package com.velauto.controller;

import com.velauto.dto.CustomerCreateDto;
import com.velauto.dto.CustomerResponseDto;
import com.velauto.dto.CustomerUpdateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

  private final CustomerService customerService;

  @PostMapping
  public ResponseEntity<CustomerResponseDto> createCustomer(
      @Valid @RequestBody CustomerCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    CustomerResponseDto response = customerService.createCustomer(request, userDetails.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{customerId}")
  public ResponseEntity<CustomerResponseDto> getCustomerById(
      @PathVariable Integer customerId,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    CustomerResponseDto response = customerService.getCustomerById(customerId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/phone/{phone}")
  public ResponseEntity<CustomerResponseDto> getByPhone(
      @PathVariable String phone,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    CustomerResponseDto response = customerService.getByPhone(phone);
    return ResponseEntity.ok(response);
  }

  @GetMapping
  public ResponseEntity<Page<CustomerResponseDto>> getCustomersByTenant(
      @RequestParam Integer tenantId,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    Page<CustomerResponseDto> response = customerService.getCustomersByTenant(tenantId, pageable);
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{customerId}")
  public ResponseEntity<CustomerResponseDto> updateCustomer(
      @PathVariable Integer customerId,
      @Valid @RequestBody CustomerUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    CustomerResponseDto response = customerService.updateCustomer(customerId, request, userDetails.getUserId());
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{customerId}")
  public ResponseEntity<Void> deleteCustomer(
      @PathVariable Integer customerId,
      @AuthenticationPrincipal CustomUserDetails userDetails) {
    customerService.deleteCustomer(customerId, userDetails.getUserId());
    return ResponseEntity.noContent().build();
  }
}


