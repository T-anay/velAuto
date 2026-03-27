package com.velauto.repository;

import com.velauto.entity.ServiceFormItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceFormItemRepository extends JpaRepository<ServiceFormItem, Integer> {

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.id = :id AND sfi.tenantId = :tenantId AND sfi.deletedAt IS NULL")
  Optional<ServiceFormItem> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.serviceFormId = :serviceFormId AND sfi.tenantId = :tenantId AND sfi.deletedAt IS NULL")
  List<ServiceFormItem> findByServiceFormIdAndTenantId(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("tenantId") Integer tenantId
  );

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.serviceFormId = :serviceFormId AND sfi.tenantId = :tenantId AND sfi.deletedAt IS NULL")
  Page<ServiceFormItem> findByServiceFormIdAndTenantIdPaged(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("tenantId") Integer tenantId,
      Pageable pageable
  );

  @Query("SELECT COUNT(sfi) FROM ServiceFormItem sfi WHERE sfi.tenantId = :tenantId AND sfi.deletedAt IS NULL")
  long countByTenantId(@Param("tenantId") Integer tenantId);
}

