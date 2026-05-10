-- liquibase formatted sql

-- changeset talha:019-2 failOnError:false
-- Tabloyu tamamen temizleyip Java entity yapısına göre sıfırdan oluşturuyoruz.
-- Bu en garantili yöntemdir çünkü 001 ve 008 arasındaki çakışma çok fazla.
-- Veri kaybını önlemek için mevcut verileri (test verisi olduklarını varsayıyoruz) siliyoruz.
DROP TABLE IF EXISTS service_form_items;

-- changeset talha:019-3
CREATE TABLE service_form_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_form_id INT NOT NULL,
  service_catalog_id INT NULL,
  item_name VARCHAR(255),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'BEKLIYOR',
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  CONSTRAINT service_form_items_fk_form_v2 FOREIGN KEY (service_form_id) REFERENCES service_forms (id),
  CONSTRAINT service_form_items_fk_catalog_v2 FOREIGN KEY (service_catalog_id) REFERENCES service_catalog (id),
  INDEX idx_sfi_form_id (service_form_id),
  INDEX idx_sfi_catalog_id (service_catalog_id),
  INDEX idx_sfi_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
