-- ============================================================
-- MIGRATION (tahap 2): kunci kolom slug jadi NOT NULL + UNIQUE
-- ============================================================
-- Jalankan ini SETELAH 03_add_slug.sql DAN setelah
-- `node scripts/generate-slugs.js` selesai mengisi slug untuk
-- semua produk yang sudah ada. Kalau dijalankan sebelum semua
-- baris terisi, ALTER TABLE ini akan gagal karena masih ada slug
-- NULL.
--
-- Jalankan SEKALI saja:
--   mysql -u root -p kicks_lab < 04_lock_slug.sql

USE kicks_lab;

ALTER TABLE products
  MODIFY COLUMN slug VARCHAR(180) NOT NULL,
  ADD UNIQUE KEY uniq_products_slug (slug);
