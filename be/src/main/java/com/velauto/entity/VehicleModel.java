package com.velauto.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "vehicle_models")
public class VehicleModel {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, length = 50)
  private String name;

  @ManyToOne
  @JoinColumn(name = "brand_id", nullable = false)
  private Brand brand;
}