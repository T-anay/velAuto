-- liquibase formatted sql

-- changeset talha:6.1 failOnError:true
-- Create appointments table with soft delete support
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  CONSTRAINT appointments_fk_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT appointments_fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  CONSTRAINT appointments_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT appointments_fk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT appointments_fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id),
  INDEX idx_appointments_customer_id (customer_id),
  INDEX idx_appointments_vehicle_id (vehicle_id),
  INDEX idx_appointments_date (appointment_date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

