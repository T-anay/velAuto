package com.velauto.repository;

import com.velauto.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

  @Query("SELECT i FROM Invoice i WHERE i.id = :id AND i.deletedAt IS NULL")
  Optional<Invoice> findByIdAndDeletedAtIsNull(@Param("id") Integer id);
  
  @Query("SELECT i FROM Invoice i WHERE i.serviceFormId = :serviceFormId AND i.deletedAt IS NULL")
  Optional<Invoice> findByServiceFormIdAndDeletedAtIsNull(@Param("serviceFormId") Integer serviceFormId);
  
  @Query(value = "SELECT MAX(CAST(SUBSTRING(invoice_number, -5) AS UNSIGNED)) FROM invoices WHERE invoice_number LIKE :prefix", nativeQuery = true)
  Integer getMaxInvoiceSequence(@Param("prefix") String prefix);
}
