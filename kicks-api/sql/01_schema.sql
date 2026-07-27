-- ============================================================
-- KICKS-API DATABASE SCHEMA (MySQL)
-- ============================================================
-- Jalankan file ini sekali untuk membuat database + semua tabel.

CREATE DATABASE IF NOT EXISTS kicks_lab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kicks_lab;

-- ------------------------------------------------------------
-- PRODUCTS
-- gender cuma 'pria' / 'wanita' — mengikuti type Gender di
-- src/data/ProductList.ts (frontend tidak punya konsep 'unisex').
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,              -- contoh: 'str-001' (slug, dipakai juga di URL)
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  gender ENUM('pria', 'wanita') NOT NULL,
  price INT UNSIGNED NOT NULL,             -- harga dalam rupiah, tanpa desimal
  original_price INT UNSIGNED NULL,        -- harga sebelum diskon, NULL kalau tidak diskon
  badge ENUM('Baru', 'Diskon', 'Terlaris') NULL,
  weight_gram INT UNSIGNED NOT NULL DEFAULT 800,  -- untuk hitung ongkir
  description TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, -- soft hide dari katalog tanpa hapus data
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT IMAGES — maks 10 foto per produk (divalidasi di aplikasi).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_sort (product_id, sort_order)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT HIGHLIGHTS — poin fitur singkat di halaman detail.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_highlights (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  content VARCHAR(255) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT COLORS — tiap warna punya foto representatif sendiri.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_colors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  name VARCHAR(60) NOT NULL,
  hex_code VARCHAR(7) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT SIZES — stok per ukuran, sumber kebenaran validasi checkout.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_sizes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  size VARCHAR(10) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_size (product_id, size)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SIZE CHART — header & rows disimpan JSON karena kolom beda per produk.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_size_chart_headers (
  product_id VARCHAR(50) PRIMARY KEY,
  headers JSON NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_size_chart_rows (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  row_data JSON NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS — dibuat saat checkout dimulai, status diupdate via webhook Midtrans.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(80) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(60) NULL,
  quantity INT UNSIGNED NOT NULL,
  price_per_item INT UNSIGNED NOT NULL,
  shipping_cost INT UNSIGNED NOT NULL DEFAULT 0,
  total_amount INT UNSIGNED NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  midtrans_transaction_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
