-- liquibase formatted sql
-- changeset copilot:012-1 failOnError:true
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_form_id INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  issue_date DATETIME NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  total_tax DECIMAL(10, 2) NOT NULL,
  pdf_url LONGTEXT,
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at DATETIME,
  deleted_at DATETIME,
  deleted_by INT,
  FOREIGN KEY (service_form_id) REFERENCES service_forms(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_invoices_invoice_number (invoice_number),
  INDEX idx_invoices_service_form_id (service_form_id),
  INDEX idx_invoices_deleted_at (deleted_at),
  INDEX idx_invoices_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


