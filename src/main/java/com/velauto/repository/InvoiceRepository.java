package com.velauto.repository;

import com.velauto.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

  @Query("SELECT i FROM Invoice i WHERE i.id = :id AND i.tenantId = :tenantId AND i.deletedAt IS NULL")
  Optional<Invoice> findByIdAndTenantId(@Param("id") Integer id, @Param("tenantId") Integer tenantId);

  @Query("SELECT i FROM Invoice i WHERE i.serviceFormId = :serviceFormId AND i.tenantId = :tenantId AND i.deletedAt IS NULL")
  Optional<Invoice> findByServiceFormIdAndTenantId(@Param("serviceFormId") Integer serviceFormId, @Param("tenantId") Integer tenantId);

  @Query(value = "SELECT MAX(CAST(SUBSTRING(invoice_number, -5) AS UNSIGNED)) FROM invoices WHERE tenant_id = :tenantId AND invoice_number LIKE :prefix",nativeQuery = true)
  Integer getMaxInvoiceSequence(@Param("tenantId") Integer tenantId, @Param("prefix") String prefix);
}

