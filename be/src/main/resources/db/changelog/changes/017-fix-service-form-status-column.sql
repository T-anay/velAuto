-- liquibase formatted sql

-- changeset talha:017-1
-- service_forms tablosundaki status kolonunu ENUM'dan VARCHAR'a çeviriyoruz
-- Çünkü ilk şemada 'acik', 'islemde' gibi Türkçe ENUM değerleri kalmış olabilir, Java ise 'OPEN', 'IN_PROGRESS' bekliyor.
ALTER TABLE service_forms MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'OPEN';

-- changeset talha:017-2
-- appointments tablosundaki status kolonunu da VARCHAR'a çevirelim (garanti olması için)
ALTER TABLE appointments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
