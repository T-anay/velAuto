-- liquibase formatted sql

-- changeset talha:3.1
-- Super admin user creation deferred to runtime CommandLineRunner (StartupSuperAdminSeeder)
-- Runtime'da PasswordEncoder ile hash'lenip veritabanına kaydedilecek
-- Password: Admin123
-- Email: superadmin@velauto.com
-- Not: Bu seed SQL'i aktif değildir, işlem uygulama başlangıcında gerçekleşir
