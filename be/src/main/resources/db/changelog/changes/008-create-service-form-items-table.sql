-- liquibase formatted sql

-- changeset talha:8.1 failOnError:true
-- Create service_form_items table
CREATE TABLE IF NOT EXISTS service_form_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_form_id INT NOT NULL,
  service_catalog_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(10, 2) NOT NULL,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  CONSTRAINT service_form_items_fk_form FOREIGN KEY (service_form_id) REFERENCES service_forms (id),
  CONSTRAINT service_form_items_fk_catalog FOREIGN KEY (service_catalog_id) REFERENCES service_catalog (id),
  CONSTRAINT service_form_items_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT service_form_items_fk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT service_form_items_fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id),
  INDEX idx_service_form_items_service_form_id (service_form_id),
  INDEX idx_service_form_items_service_catalog_id (service_catalog_id),
  INDEX idx_service_form_items_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

