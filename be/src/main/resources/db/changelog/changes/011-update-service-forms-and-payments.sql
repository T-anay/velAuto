-- liquibase formatted sql

-- changeset copilot:11-2 failOnError:true
-- Update service_forms table to add total_tax and discount columns
ALTER TABLE service_forms
  ADD COLUMN total_tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_amount;

ALTER TABLE service_forms
  ADD COLUMN discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_tax;

