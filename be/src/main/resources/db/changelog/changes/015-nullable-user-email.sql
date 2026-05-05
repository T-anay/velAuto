-- liquibase formatted sql

-- changeset talha:15.1
-- Make users.email optional so customer creation does not require email
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(100) NULL;