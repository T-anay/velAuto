package com.velauto.repository;

import com.velauto.entity.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleModelRepository extends JpaRepository<VehicleModel, Integer> {

  // Model adına göre getir
  Optional<VehicleModel> findByName(String name);
}

