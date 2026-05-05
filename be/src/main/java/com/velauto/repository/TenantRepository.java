package com.velauto.repository;

import com.velauto.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Integer> {
    // Tenant id'si Integer olduğu için Integer yazıyoruz
}