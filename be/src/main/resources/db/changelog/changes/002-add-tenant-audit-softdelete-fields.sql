-- liquibase formatted sql

-- changeset talha:2.1
-- Add tenant and audit fields to users table
ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN created_by INT DEFAULT NULL,
  ADD COLUMN updated_by INT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT DEFAULT NULL;


-- changeset talha:2.2
-- Add foreign key constraints for users table
ALTER TABLE users
  ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- changeset talha:2.3
-- Update role enum to include super_admin
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin', 'admin', 'staff', 'customer') DEFAULT 'customer';

-- changeset talha:2.4
-- Add audit and soft delete fields to customers table
ALTER TABLE customers
  ADD COLUMN updated_by INT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT DEFAULT NULL;

-- changeset talha:2.5
-- Add audit and soft delete fields to staff table
ALTER TABLE staff
  ADD COLUMN updated_by INT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT DEFAULT NULL;

-- changeset talha:2.6
-- Add audit and soft delete fields to refresh_tokens table
ALTER TABLE refresh_tokens
  ADD COLUMN updated_by INT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT DEFAULT NULL;

-- changeset talha:2.7
-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- changeset talha:2.8
-- Add index on token for faster lookups
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user_used ON password_reset_tokens(user_id, used);

-- changeset talha:2.9
-- Update audit_logs table structure
-- Note: Columns entity_type, entity_id, and details already exist in initial schema
-- Only modify user_id to allow NULL values
ALTER TABLE audit_logs
  MODIFY COLUMN user_id INT DEFAULT NULL;

