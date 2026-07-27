// Layer query untuk tabel wishlists.

import { pool } from "../config/database.js";

// Wishlist user, lengkap dengan info produk dasar untuk ditampilkan
// langsung di halaman /profile#wishlist (tanpa fetch tambahan per produk).
export async function findWishlistByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
        w.id AS wishlistId,
        w.created_at AS addedAt,
        p.id,
        p.slug,
        p.name,
        p.category,
        p.price,
        p.original_price AS originalPrice,
        p.badge,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function isProductWishlisted(userId, productId) {
  const [rows] = await pool.query(
    `SELECT id FROM wishlists WHERE user_id = ? AND product_id = ? LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

export async function addToWishlist(userId, productId) {
  // INSERT IGNORE: kalau sudah ada (UNIQUE constraint user_id+product_id),
  // diam saja alih-alih lempar error — "tambah ke wishlist" yang
  // diklik dua kali tidak seharusnya jadi error di sisi user.
  await pool.query(
    `INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)`,
    [userId, productId]
  );
}

export async function removeFromWishlist(userId, productId) {
  await pool.query(
    `DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`,
    [userId, productId]
  );
}