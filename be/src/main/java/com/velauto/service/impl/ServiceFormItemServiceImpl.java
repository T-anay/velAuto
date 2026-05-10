package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.ServiceFormItemCreateDto;
import com.velauto.dto.ServiceFormItemResponseDto;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.ServiceCatalog;
import com.velauto.entity.ServiceFormItem;
import com.velauto.entity.enums.ServiceFormStatus;
import com.velauto.entity.enums.ServiceFormItemStatus;
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
      Integer userId
  ) {
    if (request == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<ServiceForm> serviceFormOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(
        request.getServiceFormId()
    );
    if (serviceFormOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_NOT_FOUND);
    }
    ServiceForm serviceForm = serviceFormOptional.get();

    if (serviceForm.getIsLocked() != null && serviceForm.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }
    if (serviceForm.getStatus() == ServiceFormStatus.COMPLETED) {
      throw new BusinessException(Messages.SERVICE_FORM_COMPLETED);
    }
    if (serviceForm.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_DELETED);
    }

    // Catalog'dan veya DTO'dan bilgileri çek
    ServiceCatalog catalog = null;
    if (request.getServiceCatalogId() != null) {
      catalog = serviceCatalogRepository.findByIdAndDeletedAtIsNull(request.getServiceCatalogId())
          .orElseThrow(() -> new BusinessException(Messages.SERVICE_CATALOG_NOT_FOUND));
    }

    ServiceFormItem item = serviceFormItemMapper.toServiceFormItem(request);
    item.setServiceFormId(request.getServiceFormId());
    item.setServiceCatalogId(request.getServiceCatalogId());

    BigDecimal unitPrice;
    BigDecimal taxRate;

    if (catalog != null) {
      item.setItemName(catalog.getName());
      item.setTaxRate(catalog.getTaxRate());
      item.setUnitPrice(catalog.getDefaultPrice());
      unitPrice = catalog.getDefaultPrice();
      taxRate = catalog.getTaxRate();
    } else {
      if (request.getItemName() == null || request.getUnitPrice() == null) {
        throw new BusinessException("Katalog dışı işlemler için isim ve fiyat zorunludur.");
      }
      item.setItemName(request.getItemName());
      item.setUnitPrice(request.getUnitPrice());
      item.setTaxRate(request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO);
      unitPrice = request.getUnitPrice();
      taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO;
    }

    BigDecimal unitPriceQuantity = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));
    BigDecimal taxAmount = unitPriceQuantity.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    BigDecimal lineTotal = unitPriceQuantity.add(taxAmount);
    item.setLineTotal(lineTotal);

    item.setCreatedBy(userId);
    item.setCreatedAt(LocalDateTime.now());
    if (item.getStatus() == null) {
      item.setStatus(ServiceFormItemStatus.BEKLIYOR);
    }

    ServiceFormItem savedItem = serviceFormItemRepository.save(item);

    // Toplam tutarları güncelle
    List<ServiceFormItem> allItems = serviceFormItemRepository.findByServiceFormIdAndDeletedAtIsNull(
        request.getServiceFormId()
    );

    BigDecimal totalAmount = BigDecimal.ZERO;
    BigDecimal totalTax = BigDecimal.ZERO;

    for (ServiceFormItem formItem : allItems) {
      totalAmount = totalAmount.add(formItem.getLineTotal());
      BigDecimal itemUnitPriceQuantity = formItem.getUnitPrice().multiply(BigDecimal.valueOf(formItem.getQuantity()));
      BigDecimal itemTax = itemUnitPriceQuantity.multiply(formItem.getTaxRate() != null ? formItem.getTaxRate() : BigDecimal.ZERO).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
      totalTax = totalTax.add(itemTax);
    }

    serviceForm.setTotalAmount(totalAmount);
    serviceForm.setTotalTax(totalTax);
    serviceForm.setUpdatedBy(userId);
    serviceForm.setUpdatedAt(LocalDateTime.now());
    serviceFormRepository.save(serviceForm);

    String auditDetails = String.format(
        "Servis formu kalemine öğe eklendi: serviceFormID=%d, name=%s, quantity=%d, lineTotal=%s",
        request.getServiceFormId(),
        item.getItemName(),
        request.getQuantity(),
        lineTotal
    );
    auditLogService.log(userId, "SERVICE_FORM_ITEM_ADDED", "SERVICE_FORM_ITEM", savedItem.getId(), auditDetails);

    return serviceFormItemMapper.toResponseDto(savedItem);
  }

  @Override
  @Transactional(readOnly = true)
  public ServiceFormItemResponseDto getItemById(Integer itemId) {
    if (itemId == null) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }
    Optional<ServiceFormItem> itemOptional = serviceFormItemRepository.findByIdAndDeletedAtIsNull(itemId);
    if (itemOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }
    return serviceFormItemMapper.toResponseDto(itemOptional.get());
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ServiceFormItemResponseDto> getItemsByServiceForm(
      Integer serviceFormId,
      Pageable pageable
  ) {
    if (serviceFormId == null || pageable == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }
    Page<ServiceFormItem> items = serviceFormItemRepository.findByServiceFormIdAndDeletedAtIsNullPaged(
        serviceFormId,
        pageable
    );
    return items.map(serviceFormItemMapper::toResponseDto);
  }

  @Override
  public ServiceFormItemResponseDto updateItemStatus(
      Integer itemId,
      ServiceFormItemStatus status,
      Integer userId
  ) {
    if (itemId == null || status == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    ServiceFormItem item = serviceFormItemRepository.findByIdAndDeletedAtIsNull(itemId)
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND));

    ServiceForm form = serviceFormRepository.findByIdAndDeletedAtIsNull(item.getServiceFormId())
        .orElseThrow(() -> new BusinessException(Messages.SERVICE_FORM_NOT_FOUND));

    if (form.getIsLocked() != null && form.getIsLocked()) {
      throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
    }
    if (form.getStatus() == ServiceFormStatus.COMPLETED) {
      throw new BusinessException(Messages.SERVICE_FORM_COMPLETED);
    }

    item.setStatus(status);
    item.setUpdatedBy(userId);
    item.setUpdatedAt(LocalDateTime.now());

    ServiceFormItem savedItem = serviceFormItemRepository.save(item);
    auditLogService.log(userId, "SERVICE_FORM_ITEM_STATUS_UPDATED", "SERVICE_FORM_ITEM", itemId,
        "Status updated: " + status);

    return serviceFormItemMapper.toResponseDto(savedItem);
  }

  @Override
  public void deleteItem(Integer itemId, Integer userId) {
    if (itemId == null) {
      throw new BusinessException(Messages.INVALID_REQUEST);
    }

    Optional<ServiceFormItem> itemOptional = serviceFormItemRepository.findByIdAndDeletedAtIsNull(itemId);
    if (itemOptional.isEmpty()) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_NOT_FOUND);
    }

    ServiceFormItem item = itemOptional.get();

    Optional<ServiceForm> formForLockCheckOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(item.getServiceFormId());
    if (formForLockCheckOptional.isPresent()) {
      ServiceForm formForLockCheck = formForLockCheckOptional.get();
      if (formForLockCheck.getIsLocked() != null && formForLockCheck.getIsLocked()) {
        throw new BusinessException(Messages.SERVICE_FORM_LOCKED);
      }
    }

    if (item.getDeletedAt() != null) {
      throw new BusinessException(Messages.SERVICE_FORM_ITEM_ALREADY_DELETED);
    }

    LocalDateTime now = LocalDateTime.now();
    item.setDeletedAt(now);
    item.setDeletedBy(userId);
    serviceFormItemRepository.save(item);

    List<ServiceFormItem> remainingItems = serviceFormItemRepository.findByServiceFormIdAndDeletedAtIsNull(
        item.getServiceFormId()
    );

    BigDecimal totalAmount = remainingItems.stream()
        .map(ServiceFormItem::getLineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    Optional<ServiceForm> formOptional = serviceFormRepository.findByIdAndDeletedAtIsNull(item.getServiceFormId());
    if (formOptional.isPresent()) {
      ServiceForm form = formOptional.get();
      form.setTotalAmount(totalAmount);
      form.setUpdatedBy(userId);
      form.setUpdatedAt(now);
      serviceFormRepository.save(form);
    }

    auditLogService.log(userId, "SERVICE_FORM_ITEM_DELETED", "SERVICE_FORM_ITEM", itemId, "Deleted item");
  }
}
