-- liquibase formatted sql

-- changeset talha:7.1 failOnError:true
-- Create service_forms table with soft delete support
CREATE TABLE IF NOT EXISTS service_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  vehicle_id INT NOT NULL,
  customer_id INT NOT NULL,
  current_km INT NOT NULL,
  complaints TEXT,
  general_condition TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  CONSTRAINT service_forms_fk_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
  CONSTRAINT service_forms_fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  CONSTRAINT service_forms_fk_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT service_forms_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT service_forms_fk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT service_forms_fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id),
  INDEX idx_service_forms_vehicle_id (vehicle_id),
  INDEX idx_service_forms_customer_id (customer_id),
  INDEX idx_service_forms_appointment_id (appointment_id),
  INDEX idx_service_forms_status (status),
  INDEX idx_service_forms_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

