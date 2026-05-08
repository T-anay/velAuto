package com.velauto.repository;

import com.velauto.entity.ServiceFormItem;
import com.velauto.entity.enums.ServiceFormItemStatus;
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

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.id = :id AND sfi.deletedAt IS NULL")
  Optional<ServiceFormItem> findByIdAndDeletedAtIsNull(
      @Param("id") Integer id
  );

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.serviceFormId = :serviceFormId AND sfi.deletedAt IS NULL")
  List<ServiceFormItem> findByServiceFormIdAndDeletedAtIsNull(
      @Param("serviceFormId") Integer serviceFormId
  );

  @Query("SELECT sfi FROM ServiceFormItem sfi WHERE sfi.serviceFormId = :serviceFormId AND sfi.deletedAt IS NULL")
  Page<ServiceFormItem> findByServiceFormIdAndDeletedAtIsNullPaged(
      @Param("serviceFormId") Integer serviceFormId,
      Pageable pageable
  );

  @Query("SELECT COUNT(sfi) FROM ServiceFormItem sfi WHERE sfi.deletedAt IS NULL")
  long countByDeletedAtIsNull();

  @Query("SELECT CASE WHEN COUNT(sfi) > 0 THEN true ELSE false END FROM ServiceFormItem sfi WHERE sfi.serviceFormId = :serviceFormId AND sfi.deletedAt IS NULL AND sfi.status <> :status")
  boolean existsByServiceFormIdAndStatusNot(
      @Param("serviceFormId") Integer serviceFormId,
      @Param("status") ServiceFormItemStatus status
  );
}

