-- liquibase formatted sql

-- changeset talha:14.1
-- Normalize users.role enum values to uppercase so they match the Java Role enum
ALTER TABLE users
  MODIFY COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER') DEFAULT 'CUSTOMER';