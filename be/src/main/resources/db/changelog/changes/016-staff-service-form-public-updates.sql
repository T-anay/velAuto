-- liquibase formatted sql

-- changeset talha:016-1
ALTER TABLE service_form_items
  ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'BEKLIYOR';

-- changeset talha:016-2
ALTER TABLE service_forms
  ADD COLUMN assigned_staff_id INT NULL;

-- changeset talha:016-3
ALTER TABLE service_forms
  ADD CONSTRAINT service_forms_fk_assigned_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id);

-- changeset talha:016-4
CREATE INDEX idx_service_form_items_status ON service_form_items(status);

-- changeset talha:016-5
CREATE INDEX idx_service_forms_assigned_staff_id ON service_forms(assigned_staff_id);
