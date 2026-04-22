package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.ServiceFormItemCreateDto;
import com.velauto.dto.ServiceFormItemResponseDto;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.ServiceCatalog;
import com.velauto.entity.ServiceFormItem;
import com.velauto.entity.enums.ServiceFormStatus;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.ServiceFormItemMapper;
import com.velauto.repository.ServiceFormItemRepository;
import com.velauto.repository.ServiceFormRepository;
import com.velauto.repository.ServiceCatalogRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.ServiceFormItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceFormItemServiceImpl implements ServiceFormItemService {

  private final ServiceFormItemRepository serviceFormItemRepository;
  private final ServiceFormRepository serviceFormRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final ServiceFormItemMapper serviceFormItemMapper;
  private final AuditLogService auditLogService;

  @Override
  public ServiceFormItemResponseDto addItemToForm(
      ServiceFormItemCreateDto request,
      Integer tenantId,
      Integer userId
  ) {
    // Guard Clause: Validate input
    if (request == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch ServiceForm - No Optional chaining
    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndTenantId(
        request.getServiceFormId(),
        tenantId
    );
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }
    ServiceForm serviceForm = serviceFormOptional.get();

    // Guard Clause: ServiceForm is locked?
    if (serviceForm.getIsLocked() != null && serviceForm.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }

    // Guard Clause: ServiceForm is COMPLETED?
    if (serviceForm.getStatus() == ServiceFormStatus.COMPLETED) {
      throw new BusinessException(Messages.SERVICE_FORM_COMPLETED);
    }

    // Guard Clause: ServiceForm deleted?
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    // Fetch ServiceCatalog - No Optional chaining
    Optional<ServiceCatalog> catalogOptional = serviceCatalogRepository.findByIdAndTenantId(
        request.getServiceCatalogId(),
        tenantId
    );
    if (catalogOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_CATALOG_NOT_FOUND);
    }
    ServiceCatalog catalog = catalogOptional.get();

    // Guard Clause: Catalog deleted?
    if (catalog.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_CATALOG_DELETED);
    }

    // Map DTO to Entity
    ServiceFormItem item = serviceFormItemMapper.toServiceFormItem(request);
    item.setServiceFormId(request.getServiceFormId());
    item.setServiceCatalogId(request.getServiceCatalogId());

    // SNAPSHOT RULE: Copy item name and tax rate from catalog (if catalog changes, invoice data remains stable)
    item.setItemName(catalog.getName());
    item.setTaxRate(catalog.getTaxRate());
    item.setUnitPrice(catalog.getDefaultPrice());

    // Calculate lineTotal with tax: (unitPrice * quantity) + ((unitPrice * quantity) * (taxRate / 100))
    BigDecimal unitPriceQuantity = catalog.getDefaultPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
    BigDecimal taxAmount = unitPriceQuantity.multiply(catalog.getTaxRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    BigDecimal lineTotal = unitPriceQuantity.add(taxAmount);
    item.setLineTotal(lineTotal);

    item.setTenantId(tenantId);
    item.setCreatedBy(userId);
    item.setCreatedAt(LocalDateTime.now());

    // Save item
    ServiceFormItem savedItem = serviceFormItemRepository.save(item);

    // Update ServiceForm totalAmount AND totalTax
    List<ServiceFormItem> allItems = serviceFormItemRepository.findByServiceFormIdAndTenantId(
        request.getServiceFormId(),
        tenantId
    );

    BigDecimal totalAmount = BigDecimal.ZERO;
    BigDecimal totalTax = BigDecimal.ZERO;

    for (ServiceFormItem formItem : allItems) {
      totalAmount = totalAmount.add(formItem.getLineTotal());
      // Calculate tax for this item: (unitPrice * quantity) * (taxRate / 100)
      BigDecimal itemUnitPriceQuantity = formItem.getUnitPrice().multiply(BigDecimal.valueOf(formItem.getQuantity()));
      BigDecimal itemTax = itemUnitPriceQuantity.multiply(formItem.getTaxRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
      totalTax = totalTax.add(itemTax);
    }

    serviceForm.setTotalAmount(totalAmount);
    serviceForm.setTotalTax(totalTax);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());
    serviceFormRepository.save(serviceForm);

    // Audit log
    String auditDetails = String.format(
        "Servis formu kalemine oğe eklendi: serviceFormID=%d, catalogID=%d, quantity=%d, unitPrice=%s, lineTotal=%s, taxRate=%s",
        request.getServiceFormId(),
        request.getServiceCatalogId(),
        request.getQuantity(),
        catalog.getDefaultPrice(),
        lineTotal,
        catalog.getTaxRate()
    );
    auditLogService.log(userId, "SERVICE_FORM_ITEM_ADDED", "SERVICE_FORM_ITEM", savedItem.getId(), auditDetails);

    return serviceFormItemMapper.toResponseDto(savedItem);
  }

  @Override
  @Transactional(readOnly = true)
  public ServiceFormItemResponseDto getItemById(Integer itemId, Integer tenantId) {
    // Guard Clause: Validate input
    if (itemId == null || tenantId == null) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }

    // Fetch item - No Optional chaining
    Optional<ServiceFormItem> itemOptional = serviceFormItemRepository.findByIdAndTenantId(itemId, tenantId);
    if (itemOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }

    ServiceFormItem item = itemOptional.get();
    return serviceFormItemMapper.toResponseDto(item);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormItemResponseDto> getItemsByServiceForm(
      Integer serviceFormId,
      Integer tenantId,
      Pageable pageable
  ) {
    // Guard Clause: Validate input
    if (serviceFormId == null || tenantId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Page<ServiceFormItem> items = serviceFormItemRepository.findByServiceFormIdAndTenantIdPaged(
        serviceFormId,
        tenantId,
        pageable
    );
    return items.map(serviceFormItemMapper::toResponseDto);
  }

  @Override
  public void deleteItem(Integer itemId, Integer tenantId, Integer userId) {
    // Guard Clause: Validate input
    if (itemId == null || tenantId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    // Fetch item - No Optional chaining
    Optional<ServiceFormItem> itemOptional = serviceFormItemRepository.findByIdAndTenantId(itemId, tenantId);
    if (itemOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }

    ServiceFormItem item = itemOptional.get();

    // Guard Clause: ServiceForm is locked?
    Optional<ServiceForm> formForLockCheckOptional = serviceFormRepository.findByIdAndTenantId(item.getServiceFormId(), tenantId);
    if (formForLockCheckOptional.isPresent()) {
      ServiceForm formForLockCheck = formForLockCheckOptional.get();
      if (formForLockCheck.getIsLocked() != null && formForLockCheck.getIsLocked()) {
        throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
      }
    }

    // Guard Clause: Already deleted?
    if (item.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_ALREADY_DELETED);
    }

    // Soft delete
    LocalDateTime now = LocalDateTime.now();
    item.setDeletedAt(now);
    item.setDeletedBy(userId);
    serviceFormItemRepository.save(item);

    // Recalculate ServiceForm totalAmount
    List<ServiceFormItem> remainingItems = serviceFormItemRepository.findByServiceFormIdAndTenantId(
        item.getServiceFormId(),
        tenantId
    );

    BigDecimal totalAmount = remainingItems.stream()
        .map(ServiceFormItem::getLineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    Optional<ServiceForm> formOptional = serviceFormRepository.findByIdAndTenantId(item.getServiceFormId(), tenantId);
    if (formOptional.isPresent()) {
      ServiceForm form = formOptional.get();
      form.setTotalAmount(totalAmount);
      form.setUpdatedBy(userId);
      form.setUpdatedAt(now);
      serviceFormRepository.save(form);
    }

    // Audit log
    String auditDetails = String.format(
        "Servis formu kalemi silindi: serviceFormID=%d, lineTotal=%s",
        item.getServiceFormId(),
        item.getLineTotal()
    );
    auditLogService.log(userId, "SERVICE_FORM_ITEM_DELETED", "SERVICE_FORM_ITEM", itemId, auditDetails);
  }
}

