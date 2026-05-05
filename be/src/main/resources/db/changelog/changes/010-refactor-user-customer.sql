-- liquibase formatted sql

-- changeset copilot:10-1
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100) NULL AFTER id,
  ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name,
  ADD COLUMN phone VARCHAR(20) NULL AFTER email;

-- changeset copilot:10-2
UPDATE users u
JOIN customers c ON c.user_id = u.id
SET
  u.phone = CASE
    WHEN c.phone IS NULL THEN NULL
    WHEN LEFT(REGEXP_REPLACE(c.phone, '[^0-9+]', ''), 1) = '+' THEN REGEXP_REPLACE(c.phone, '[^0-9+]', '')
    ELSE CONCAT('+90', REGEXP_REPLACE(c.phone, '[^0-9]', ''))
  END,
  u.first_name = CASE
    WHEN c.full_name IS NULL OR TRIM(c.full_name) = '' THEN u.first_name
    WHEN LOCATE(' ', TRIM(c.full_name)) > 0 THEN SUBSTRING_INDEX(TRIM(c.full_name), ' ', 1)
    ELSE TRIM(c.full_name)
  END,
  u.last_name = CASE
    WHEN c.full_name IS NULL OR TRIM(c.full_name) = '' THEN u.last_name
    WHEN LOCATE(' ', TRIM(c.full_name)) > 0 THEN TRIM(SUBSTRING(TRIM(c.full_name), LOCATE(' ', TRIM(c.full_name)) + 1))
    ELSE u.last_name
  END
WHERE c.deleted_at IS NULL;

-- changeset copilot:10-3
UPDATE users
SET phone = CONCAT('+90', id)
WHERE phone IS NULL OR TRIM(phone) = '';

-- changeset copilot:10-4
UPDATE users u
JOIN (
  SELECT tenant_id, phone, MIN(id) AS keep_id
  FROM users
  WHERE phone IS NOT NULL
  GROUP BY tenant_id, phone
  HAVING COUNT(*) > 1
) d ON (u.tenant_id <=> d.tenant_id) AND u.phone = d.phone
SET u.phone = CONCAT(u.phone, '-', u.id)
WHERE u.id <> d.keep_id;

-- changeset copilot:10-5
ALTER TABLE users
  MODIFY COLUMN phone VARCHAR(20) NOT NULL;

-- changeset copilot:10-6
ALTER TABLE users
  ADD CONSTRAINT uk_users_tenant_phone UNIQUE (tenant_id, phone);

-- changeset copilot:10-7
ALTER TABLE customers
  DROP COLUMN full_name,
  DROP COLUMN phone,
  ADD COLUMN tax_number VARCHAR(50) NULL AFTER address,
  ADD COLUMN tax_office VARCHAR(100) NULL AFTER tax_number,
  ADD COLUMN customer_type ENUM('INDIVIDUAL', 'CORPORATE') NOT NULL DEFAULT 'INDIVIDUAL' AFTER company_name,
  ADD COLUMN discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER customer_type;

