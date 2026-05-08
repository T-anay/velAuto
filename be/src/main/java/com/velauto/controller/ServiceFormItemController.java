package com.velauto.controller;

import com.velauto.dto.ServiceFormItemCreateDto;
import com.velauto.dto.ServiceFormItemResponseDto;
import com.velauto.dto.ServiceFormItemStatusUpdateDto;
import com.velauto.security.CustomUserDetails;
import com.velauto.service.ServiceFormItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/service-form-items")
@RequiredArgsConstructor
public class ServiceFormItemController {

  private final ServiceFormItemService serviceFormItemService;

  @PostMapping
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormItemResponseDto> addItemToForm(
      @Valid @RequestBody ServiceFormItemCreateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormItemResponseDto response = serviceFormItemService.addItemToForm(
        request,
        userDetails.getUserId()
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormItemResponseDto> getItemById(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormItemResponseDto response = serviceFormItemService.getItemById(
        id
    );
    return ResponseEntity.ok(response);
  }

  @GetMapping("/by-form/{serviceFormId}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Page<ServiceFormItemResponseDto>> getItemsByServiceForm(
      @PathVariable Integer serviceFormId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ServiceFormItemResponseDto> response = serviceFormItemService.getItemsByServiceForm(
        serviceFormId,
        pageable
    );
    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{id}/status")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<ServiceFormItemResponseDto> updateItemStatus(
      @PathVariable Integer id,
      @Valid @RequestBody ServiceFormItemStatusUpdateDto request,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    ServiceFormItemResponseDto response = serviceFormItemService.updateItemStatus(
        id,
        request.getStatus(),
        userDetails.getUserId()
    );
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('admin', 'manager', 'staff')")
  public ResponseEntity<Void> deleteItem(
      @PathVariable Integer id,
      @AuthenticationPrincipal CustomUserDetails userDetails
  ) {
    serviceFormItemService.deleteItem(
        id,
        userDetails.getUserId()
    );
    return ResponseEntity.noContent().build();
  }
}

