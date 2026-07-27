// Layer query untuk tabel orders.

import { pool } from "../config/database.js";

// Order yang masih 'pending' lebih dari 10 menit dianggap hangus. Keputusan
// produk: tidak ada status "menunggu pembayaran" yang menggantung lama di
// riwayat — kalau dalam 10 menit belum lunas, otomatis dianggap expired.
// Dipanggil sebelum membaca data order (lazy expiry), supaya tetap akurat
// meskipun webhook Midtrans belum/tidak pernah sampai (mis. saat dev lokal
// tanpa URL publik untuk notifikasi).
const PENDING_EXPIRY_MINUTES = 10;

export async function expireStaleOrders() {
  await pool.query(
    `UPDATE orders
     SET status = 'expired'
     WHERE status = 'pending'
       AND created_at < (NOW() - INTERVAL ? MINUTE)`,
    [PENDING_EXPIRY_MINUTES]
  );
}

export async function createOrder(order) {
  await pool.query(
    `INSERT INTO orders (
        order_id, user_id, product_id, size, color, quantity,
        price_per_item, shipping_cost, total_amount,
        customer_name, customer_email, customer_phone, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      order.orderId,
      order.userId,
      order.productId,
      order.size,
      order.color,
      order.quantity,
      order.pricePerItem,
      order.shippingCost,
      order.totalAmount,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
    ]
  );
}

export async function updateOrderStatus(orderId, status, midtransTransactionId = null) {
  await pool.query(
    `UPDATE orders
     SET status = ?, midtrans_transaction_id = COALESCE(?, midtrans_transaction_id)
     WHERE order_id = ?`,
    [status, midtransTransactionId, orderId]
  );
}

export async function findOrderById(orderId) {
  await expireStaleOrders();
  const [rows] = await pool.query(
    `SELECT * FROM orders WHERE order_id = ? LIMIT 1`,
    [orderId]
  );
  return rows[0] ?? null;
}

// Riwayat pembayaran user, lengkap dengan info produk untuk ditampilkan
// langsung di halaman /profile#riwayat.
//
// HANYA status final (paid/failed/expired/cancelled) yang dikembalikan —
// status 'pending' disembunyikan sesuai keputusan produk: user tidak perlu
// melihat baris "menunggu pembayaran" yang menggantung di riwayat. Kalau
// pending-nya sudah lewat 10 menit, expireStaleOrders() di atas akan
// mengubahnya jadi 'expired' duluan sehingga tetap muncul (sebagai hangus).
export async function findOrdersByUserId(userId) {
  await expireStaleOrders();

  const [rows] = await pool.query(
    `SELECT
        o.order_id AS orderId,
        o.product_id,
        o.size,
        o.color,
        o.quantity,
        o.price_per_item AS pricePerItem,
        o.shipping_cost AS shippingCost,
        o.total_amount AS totalAmount,
        o.status,
        o.created_at AS createdAt,
        p.slug,
        p.name,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image
     FROM orders o
     JOIN products p ON p.id = o.product_id
     WHERE o.user_id = ? AND o.status != 'pending'
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
}