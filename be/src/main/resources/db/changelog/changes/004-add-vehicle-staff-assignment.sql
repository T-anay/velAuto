-- liquibase formatted sql

-- changeset talha:4.1
-- Add odometer, assigned_staff_id, and soft delete fields to vehicles table, make customer_id nullable
ALTER TABLE vehicles
  MODIFY customer_id INT DEFAULT NULL,
  ADD COLUMN assigned_staff_id INT DEFAULT NULL,
  ADD COLUMN odometer INT DEFAULT NULL,
  ADD COLUMN updated_by INT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT DEFAULT NULL,
  ADD CONSTRAINT vehicles_ibfk_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff (id) ON DELETE SET NULL;

