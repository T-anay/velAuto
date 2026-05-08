-- liquibase formatted sql

-- changeset talha:0
-- Tenants table removed - System now operates without multi-tenancy
-- All entities are isolated by user/organization context

-- changeset talha:1
CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role ENUM('admin', 'staff', 'customer') DEFAULT 'customer',
                       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- changeset talha:2
CREATE TABLE customers (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           user_id INT DEFAULT NULL,
                           full_name VARCHAR(100) NOT NULL,
                           phone VARCHAR(20) NOT NULL UNIQUE,
                           address TEXT,
                           company_name VARCHAR(100) DEFAULT NULL,
                           created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                           CONSTRAINT customers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- changeset talha:3
CREATE TABLE vehicles (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          customer_id INT NOT NULL,
                          plate VARCHAR(20) NOT NULL UNIQUE,
                          brand VARCHAR(50) DEFAULT NULL,
                          model VARCHAR(50) DEFAULT NULL,
                          year SMALLINT DEFAULT NULL,
                          chassis_no VARCHAR(50) DEFAULT NULL,
                          current_km INT DEFAULT 0,
                          CONSTRAINT vehicles_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);

-- changeset talha:4
CREATE TABLE appointments (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              customer_id INT NOT NULL,
                              vehicle_id INT NOT NULL,
                              requested_date TIMESTAMP NULL DEFAULT NULL,
                              status ENUM('beklemede', 'teklif_revize', 'onaylandi', 'iptal', 'tamamlandi') DEFAULT 'beklemede',
                              customer_note TEXT,
                              staff_note TEXT,
                              created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                              CONSTRAINT appointments_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customers (id),
                              CONSTRAINT appointments_ibfk_2 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- changeset talha:5
CREATE TABLE service_forms (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               appointment_id INT DEFAULT NULL UNIQUE,
                               vehicle_id INT NOT NULL,
                               complaint TEXT,
                               inspection_notes TEXT,
                               diagnosis TEXT,
                               status ENUM('acik', 'islemde', 'kapali') DEFAULT 'acik',
                               total_amount DECIMAL(10, 2) DEFAULT 0.00,
                               created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT service_forms_ibfk_1 FOREIGN KEY (appointment_id) REFERENCES appointments (id),
                               CONSTRAINT service_forms_ibfk_2 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- changeset talha:6
CREATE TABLE staff (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       user_id INT NOT NULL,
                       full_name VARCHAR(100) NOT NULL,
                       phone VARCHAR(20) DEFAULT NULL,
                       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                       CONSTRAINT staff_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- changeset talha:7
CREATE TABLE service_catalog (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 name VARCHAR(150) NOT NULL,
                                 type ENUM('parca', 'iscilik') NOT NULL,
                                 price DECIMAL(10, 2) NOT NULL,
                                 is_active TINYINT(1) DEFAULT 1
);

-- changeset talha:8
CREATE TABLE service_form_items (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    form_id INT NOT NULL,
                                    catalog_item_id INT DEFAULT NULL,
                                    custom_description VARCHAR(255) DEFAULT NULL,
                                    quantity INT DEFAULT 1,
                                    unit_price DECIMAL(10, 2) NOT NULL,
                                    performed_by INT DEFAULT NULL,
                                    CONSTRAINT service_form_items_ibfk_1 FOREIGN KEY (form_id) REFERENCES service_forms (id) ON DELETE CASCADE,
                                    CONSTRAINT service_form_items_ibfk_2 FOREIGN KEY (catalog_item_id) REFERENCES service_catalog (id),
                                    CONSTRAINT service_form_items_ibfk_3 FOREIGN KEY (performed_by) REFERENCES staff (id)
);

-- changeset talha:9
CREATE TABLE audit_logs (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT DEFAULT NULL,
                            action VARCHAR(100) DEFAULT NULL,
                            entity_type VARCHAR(50) DEFAULT NULL,
                            entity_id INT DEFAULT NULL,
                            old_value JSON DEFAULT NULL,
                            new_value JSON DEFAULT NULL,
                            details JSON DEFAULT NULL,
                            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- changeset talha:10
CREATE TABLE chat_logs (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           customer_id INT DEFAULT NULL,
                           vehicle_id INT DEFAULT NULL,
                           message_content TEXT,
                           sender ENUM('customer', 'ai_assistant', 'staff') DEFAULT NULL,
                           created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- changeset talha:11
CREATE TABLE refresh_tokens (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                user_id INT NOT NULL,
                                token VARCHAR(255) NOT NULL UNIQUE,
                                expiry_date TIMESTAMP NOT NULL,
                                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT refresh_tokens_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- changeset talha:12
CREATE TABLE payments (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          form_id INT NOT NULL,
                          amount DECIMAL(10, 2) NOT NULL,
                          payment_method ENUM('nakit', 'kk', 'havale') DEFAULT 'nakit',
                          paid_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                          CONSTRAINT payments_ibfk_1 FOREIGN KEY (form_id) REFERENCES service_forms (id)
);

-- changeset talha:13
CREATE TABLE notifications (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               customer_id INT NOT NULL,
                               channel ENUM('sms', 'whatsapp', 'sistem') DEFAULT 'sistem',
                               purpose VARCHAR(100) DEFAULT NULL,
                               message_text TEXT,
                               sent_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                               sent_by INT DEFAULT NULL,
                               CONSTRAINT notifications_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customers (id),
                               CONSTRAINT notifications_ibfk_2 FOREIGN KEY (sent_by) REFERENCES users (id)
);