-- liquibase formatted sql

-- changeset talha:5.2 failOnError:true
-- Create service_catalog table with multi-tenant and soft delete support
-- preConditions: Table doesn't exist (if it does, this changeset is skipped)
-- precondition: not tableExists
--   tableName: service_catalog
-- precondition: end
CREATE TABLE IF NOT EXISTS service_catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  default_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  UNIQUE KEY uk_service_catalog_code (code),
  UNIQUE KEY uk_service_catalog_name_tenant (name, tenant_id, deleted_at),
  CONSTRAINT service_catalog_fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT service_catalog_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT service_catalog_fk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT service_catalog_fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id),
  INDEX idx_service_catalog_tenant_id (tenant_id),
  INDEX idx_service_catalog_deleted_at (deleted_at),
  INDEX idx_service_catalog_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

