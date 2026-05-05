-- liquibase formatted sql

-- changeset talha:9.1 failOnError:true
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_form_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  tenant_id INT NOT NULL,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  CONSTRAINT payments_fk_form FOREIGN KEY (service_form_id) REFERENCES service_forms (id),
  CONSTRAINT payments_fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT payments_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT payments_fk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT payments_fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id),
  INDEX idx_payments_tenant_id (tenant_id),
  INDEX idx_payments_service_form_id (service_form_id),
  INDEX idx_payments_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

