-- ============================================================
-- MIGRATION: tambah kolom slug ke tabel products
-- ============================================================
-- Tujuan: URL produk di frontend jadi /produk/vantage-runner
-- alih-alih /produk/str-001, supaya lebih ramah dibaca & SEO.
--
-- PENTING: kolom `id` (str-001 dst) TIDAK diubah/dihapus — tetap
-- jadi PRIMARY KEY dan tetap dipakai semua FOREIGN KEY di tabel
-- relasi (product_images, product_sizes, dst). `slug` murni kolom
-- tambahan untuk URL saja, jadi migration ini aman dijalankan
-- tanpa merusak data/relasi yang sudah ada.
--
-- Setelah menjalankan file ini, isi slug untuk produk yang sudah
-- ada dengan menjalankan:
--   node scripts/generate-slugs.js
-- (generate slug di Node, bukan SQL, supaya tidak bergantung pada
-- REGEXP_REPLACE yang hanya tersedia di MySQL 8.0.4+ — aman untuk
-- semua versi MySQL/MariaDB).
--
-- Jalankan SEKALI saja:
--   mysql -u root -p kicks_lab < 03_add_slug.sql

USE kicks_lab;

ALTER TABLE products
  ADD COLUMN slug VARCHAR(180) NULL AFTER id;
