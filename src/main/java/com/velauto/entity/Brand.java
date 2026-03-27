package com.velauto.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "brands")
public class Brand {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true, length = 50)
  private String name; // Örn: BMW, Mercedes, Togg
}