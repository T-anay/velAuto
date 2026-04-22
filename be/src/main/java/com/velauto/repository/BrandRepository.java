package com.velauto.repository;

import com.velauto.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {

  // Marka adına göre getir
  Optional<Brand> findByName(String name);
}

