-- ============================================================
-- MIGRATION: wishlist, keranjang, dan kaitkan orders ke users
-- ============================================================
-- Jalankan SEKALI saja, lewat tab SQL phpMyAdmin (database kicks_lab).

USE kicks_lab;

-- ------------------------------------------------------------
-- WISHLIST
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  -- Satu user tidak bisa wishlist produk yang sama dua kali.
  UNIQUE KEY uniq_wishlist_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- KERANJANG (CART)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(60) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  
  UNIQUE KEY uniq_cart_user_product_variant (user_id, product_id, size, color)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS — kaitkan ke user (checkout wajib login)
-- ------------------------------------------------------------

ALTER TABLE orders
  ADD COLUMN user_id VARCHAR(36) NULL AFTER order_id,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
