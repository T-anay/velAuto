package com.velauto.repository;

import com.velauto.entity.Customer;
import com.velauto.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

  // FUTURE NOTE: Soft delete filtresini değiştirmek için "deleted_at IS NULL" klauzülünü güncelleyin

  // Belirli bir kullanıcıya ait müşteri profilini bulur (soft delete filtreli)
  @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL AND c.user = :user")
  Optional<Customer> findByUser(@Param("user") User user);

  // Telefon numarasına göre müşteri arama via User entity (SSOT model)
  // Phone artık User tablosunda, Customer'dan silinmiştir
  @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL AND c.user.phone = :phone")
  Optional<Customer> findByUserPhone(@Param("phone") String phone);


  // ID ile arama yaparken soft-delete filtresi uygulamak için yardımcı metot
  Optional<Customer> findByIdAndDeletedAtIsNull(Integer id);
}

