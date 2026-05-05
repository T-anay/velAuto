package com.velauto.repository;

import com.velauto.entity.ServiceCatalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, Integer> {

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.id = :id AND sc.tenantId = :tenantId")
  Optional<ServiceCatalog> findByIdAndTenantId(
      @Param("id") Integer id,
      @Param("tenantId") Integer tenantId);

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.name = :name AND sc.tenantId = :tenantId")
  Optional<ServiceCatalog> findByNameAndTenantId(
      @Param("name") String name,
      @Param("tenantId") Integer tenantId);

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.tenantId = :tenantId")
  Page<ServiceCatalog> findByTenantId(
      @Param("tenantId") Integer tenantId,
      Pageable pageable);

  @Query("SELECT COUNT(sc) FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.tenantId = :tenantId")
  long countByTenantId(@Param("tenantId") Integer tenantId);

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.tenantId = :tenantId ORDER BY sc.name ASC")
  java.util.List<ServiceCatalog> findByTenantId(@Param("tenantId") Integer tenantId);

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.tenantId = :tenantId AND LOWER(sc.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY sc.name ASC")
  java.util.List<ServiceCatalog> findByTenantIdAndNameContainingIgnoreCase(@Param("tenantId") Integer tenantId, @Param("keyword") String keyword);
}
