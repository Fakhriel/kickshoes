-- ============================================================
-- SEED DATA — sinkron dengan src/data/ProductList.ts +
-- src/data/ProductDetails.ts di frontend (per 2026-06-20).
--
-- Catatan: ProductList.ts di frontend berisi 12 produk, tapi cuma
-- str-001 & str-002 yang punya detail lengkap (size/warna/foto) di
-- ProductDetails.ts. Sisa 10 produk BELUM di-seed — tambahkan lewat
-- INSERT manual atau dashboard nanti begitu detailnya tersedia.
-- ============================================================

USE kicks_lab;

-- created_at dibuat eksplisit sama dengan field createdAt di
-- ProductList.ts (bukan default CURRENT_TIMESTAMP) supaya sort
-- "Terbaru" di /koleksi-baru identik dengan urutan di frontend lama.

-- ------------------------------------------------------------
-- PRODUCT 1: Vantage Runner (pria, badge Baru)
-- ------------------------------------------------------------
INSERT INTO products (id, name, category, gender, price, original_price, badge, weight_gram, description, created_at)
VALUES (
  'str-001',
  'Vantage Runner',
  'Running',
  'pria',
  1299000,
  NULL,
  'Baru',
  850,
  'Vantage Runner dirancang untuk lari jarak menengah hingga jauh. Midsole busa ganda meredam impact tanpa bikin sepatu berat, sementara upper rajut bernapas menjaga kaki tetap sejuk dari kilometer pertama sampai terakhir.',
  '2026-06-10 00:00:00'
);

INSERT INTO product_images (product_id, image_url, sort_order) VALUES
  ('str-001', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80', 0),
  ('str-001', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&blend=000000&blend-mode=normal&blend-alpha=0', 1),
  ('str-001', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80', 2),
  ('str-001', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=80', 3),
  ('str-001', 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1200&q=80', 4);

INSERT INTO product_highlights (product_id, content, sort_order) VALUES
  ('str-001', 'Midsole dual-density meredam impact', 0),
  ('str-001', 'Upper knit breathable, ringan dan elastis', 1),
  ('str-001', 'Outsole karet anti-slip pola multi-arah', 2),
  ('str-001', 'Insole empuk dengan arch support', 3);

INSERT INTO product_colors (product_id, name, hex_code, image_url, sort_order) VALUES
  ('str-001', 'Ink Black', '#1A1A1A', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80', 0),
  ('str-001', 'Paper White', '#F5F3EE', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80', 1),
  ('str-001', 'Signal Red', '#C8442C', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=80', 2);

INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES
  ('str-001', '39', 4, 0),
  ('str-001', '40', 8, 1),
  ('str-001', '41', 12, 2),
  ('str-001', '42', 6, 3),
  ('str-001', '43', 0, 4),
  ('str-001', '44', 3, 5);

INSERT INTO product_size_chart_headers (product_id, headers) VALUES
  ('str-001', '["EU", "UK", "US", "Panjang Kaki (cm)"]');

INSERT INTO product_size_chart_rows (product_id, row_data, sort_order) VALUES
  ('str-001', '["39", "6", "6.5", "24.0"]', 0),
  ('str-001', '["40", "6.5", "7", "24.6"]', 1),
  ('str-001', '["41", "7.5", "8", "25.3"]', 2),
  ('str-001', '["42", "8", "8.5", "26.0"]', 3),
  ('str-001', '["43", "9", "9.5", "26.7"]', 4),
  ('str-001', '["44", "9.5", "10", "27.3"]', 5);

-- ------------------------------------------------------------
-- PRODUCT 2: Concrete Low (pria, badge Diskon)
-- ------------------------------------------------------------
INSERT INTO products (id, name, category, gender, price, original_price, badge, weight_gram, description, created_at)
VALUES (
  'str-002',
  'Concrete Low',
  'Lifestyle',
  'pria',
  999000,
  1399000,
  'Diskon',
  700,
  'Concrete Low adalah sneaker harian dengan siluet low-top yang bersih. Dibuat dari kanvas tebal dan sol karet vulkanisir, sepatu ini dipakai dari kantor sampai akhir pekan tanpa kompromi gaya.',
  '2026-05-02 00:00:00'
);

INSERT INTO product_images (product_id, image_url, sort_order) VALUES
  ('str-002', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80', 0),
  ('str-002', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=80', 1),
  ('str-002', 'https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=1200&q=80', 2),
  ('str-002', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80', 3);

INSERT INTO product_highlights (product_id, content, sort_order) VALUES
  ('str-002', 'Kanvas tebal anti-kusut', 0),
  ('str-002', 'Sol vulkanisir, lebih awet & fleksibel', 1),
  ('str-002', 'Lubang ventilasi tersembunyi', 2),
  ('str-002', 'Insole memory foam', 3);

INSERT INTO product_colors (product_id, name, hex_code, image_url, sort_order) VALUES
  ('str-002', 'Concrete Grey', '#9C9C94', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80', 0),
  ('str-002', 'Ink Black', '#1A1A1A', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=80', 1);

INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES
  ('str-002', '38', 5, 0),
  ('str-002', '39', 0, 1),
  ('str-002', '40', 10, 2),
  ('str-002', '41', 7, 3),
  ('str-002', '42', 2, 4);

INSERT INTO product_size_chart_headers (product_id, headers) VALUES
  ('str-002', '["EU", "UK", "US", "Panjang Kaki (cm)"]');

INSERT INTO product_size_chart_rows (product_id, row_data, sort_order) VALUES
  ('str-002', '["38", "5", "5.5", "23.3"]', 0),
  ('str-002', '["39", "6", "6.5", "24.0"]', 1),
  ('str-002', '["40", "6.5", "7", "24.6"]', 2),
  ('str-002', '["41", "7.5", "8", "25.3"]', 3),
  ('str-002', '["42", "8", "8.5", "26.0"]', 4);
