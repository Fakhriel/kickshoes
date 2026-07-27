-- ============================================================
-- MIGRATION: tabel users untuk autentikasi
-- ============================================================
-- Email + password jadi metode utama (password di-hash bcrypt,
-- TIDAK PERNAH disimpan plain text). Kolom google_id/facebook_id
-- disiapkan kosong (NULL) untuk dipakai nanti kalau social login
-- mau diimplementasi — user yang daftar lewat email/password akan
-- punya nilai NULL di kedua kolom itu, dan password_hash boleh NULL
-- untuk user yang nanti daftar murni lewat Google/Facebook (tidak
-- pernah set password manual).
--
-- Jalankan SEKALI saja:
--   Paste isi file ini di tab SQL phpMyAdmin (database kicks_lab)

USE kicks_lab;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,            
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NULL,       
  google_id VARCHAR(100) NULL,
  facebook_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_users_email (email),
  UNIQUE KEY uniq_users_google_id (google_id),
  UNIQUE KEY uniq_users_facebook_id (facebook_id)
) ENGINE=InnoDB;
