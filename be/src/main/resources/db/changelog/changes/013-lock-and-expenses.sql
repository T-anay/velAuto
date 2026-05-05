-- liquibase formatted sql

-- changeset talha:013-1
-- Add is_locked column to service_forms table
ALTER TABLE service_forms ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

-- changeset talha:013-2
-- Create expenses table
CREATE TABLE expenses (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          tenant_id INT NOT NULL,
                          amount DECIMAL(10, 2) NOT NULL,
                          expense_date DATE NOT NULL,
                          category VARCHAR(50) NOT NULL,
                          description TEXT,
                          created_by INT,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_by INT,
                          updated_at TIMESTAMP NULL DEFAULT NULL,
                          deleted_at TIMESTAMP NULL DEFAULT NULL,
                          deleted_by INT,
                          CONSTRAINT fk_expenses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
                          CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by) REFERENCES users(id),
                          CONSTRAINT fk_expenses_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
                          CONSTRAINT fk_expenses_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- changeset talha:013-3
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date);
CREATE INDEX idx_expenses_tenant_category ON expenses(tenant_id, category);