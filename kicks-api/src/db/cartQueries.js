// Layer query untuk tabel carts.

import { pool } from "../config/database.js";

// Isi keranjang user, lengkap dengan info produk untuk ditampilkan
// langsung di halaman /profile#keranjang (nama, harga, foto) tanpa
// fetch tambahan per item.
export async function findCartByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
        c.id AS cartItemId,
        c.product_id,
        c.size,
        c.color,
        c.quantity,
        c.created_at AS addedAt,
        p.slug,
        p.name,
        p.price,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image
     FROM carts c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function findCartItem(userId, productId, size, color) {
  const [rows] = await pool.query(
    `SELECT id, quantity FROM carts
     WHERE user_id = ? AND product_id = ? AND size = ?
       AND color <=> ?
     LIMIT 1`,
    [userId, productId, size, color]
  );
  return rows[0] ?? null;
}

// "Tambah ke keranjang" — kalau kombinasi produk+ukuran+warna yang
// SAMA sudah ada, quantity-nya yang bertambah (bukan bikin baris baru).
// Pakai <=> (NULL-safe equal) di findCartItem supaya color=NULL juga
// bisa match dengan benar (= biasa di SQL tidak pernah match NULL).
export async function addOrIncrementCartItem({ userId, productId, size, color, quantity }) {
  const existing = await findCartItem(userId, productId, size, color);

  if (existing) {
    await pool.query(`UPDATE carts SET quantity = quantity + ? WHERE id = ?`, [
      quantity,
      existing.id,
    ]);
    return;
  }

  await pool.query(
    `INSERT INTO carts (user_id, product_id, size, color, quantity)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, productId, size, color, quantity]
  );
}

export async function updateCartItemQuantity(userId, cartItemId, quantity) {
  await pool.query(
    `UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?`,
    [quantity, cartItemId, userId]
  );
}

export async function removeCartItem(userId, cartItemId) {
  await pool.query(`DELETE FROM carts WHERE id = ? AND user_id = ?`, [
    cartItemId,
    userId,
  ]);
}

export async function clearCart(userId) {
  await pool.query(`DELETE FROM carts WHERE user_id = ?`, [userId]);
}