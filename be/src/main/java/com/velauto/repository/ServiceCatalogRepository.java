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

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.id = :id")
  Optional<ServiceCatalog> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND sc.name = :name")
  Optional<ServiceCatalog> findByNameAndDeletedAtIsNull(
      @Param("name") String name
  );

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL")
  Page<ServiceCatalog> findByDeletedAtIsNull(
      Pageable pageable
  );

  @Query("SELECT COUNT(sc) FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL")
  long countByDeletedAtIsNull();

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL ORDER BY sc.name ASC")
  java.util.List<ServiceCatalog> findByDeletedAtIsNullOrderByName();

  @Query("SELECT sc FROM ServiceCatalog sc WHERE sc.deletedAt IS NULL AND LOWER(sc.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY sc.name ASC")
  java.util.List<ServiceCatalog> findByDeletedAtIsNullAndNameContainingIgnoreCase(@Param("keyword") String keyword);
}
