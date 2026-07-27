import { findProductById, findSizeStock, decrementStock } from "../db/productQueries.js";
import { createOrder, updateOrderStatus, findOrderById, findOrdersByUserId } from "../db/orderQueries.js";

const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";


export async function postCreateTransaction(req, res) {
  try {
    const {
      productId,
      size,
      color,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body ?? {};

    if (!productId || !size || !quantity || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: "Data transaksi tidak lengkap." });
    }

    // Validasi harga & stok dari database, BUKAN dari input frontend,
    // supaya orang tidak bisa mengubah harga lewat devtools/request manual.
    const product = await findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    const availableStock = await findSizeStock(productId, size);
    if (availableStock === null) {
      return res.status(400).json({ error: "Ukuran tidak tersedia untuk produk ini." });
    }
    if (availableStock < quantity) {
      return res.status(409).json({
        error: `Stok tidak cukup. Tersisa ${availableStock} pasang untuk ukuran ${size}.`,
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY belum diset di .env.");
    }

    const shippingCost = Number(req.body.shippingCost) || 0;
    const pricePerItem = product.price;
    const totalAmount = pricePerItem * quantity + shippingCost;
    const orderId = `${productId}-${Date.now()}`;

    const itemDetails = [
      {
        id: orderId,
        price: pricePerItem,
        quantity,
        name: `${product.name} - ${size} / ${color}`.slice(0, 50),
      },
    ];

    if (shippingCost > 0) {
      itemDetails.push({
        id: "ONGKIR",
        price: shippingCost,
        quantity: 1,
        name: "Biaya Pengiriman",
      });
    }

    const snapBody = {
      transaction_details: { order_id: orderId, gross_amount: totalAmount },
      item_details: itemDetails,
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      // Transaksi yang tidak dibayar dalam 10 menit otomatis dianggap
      // expired oleh Midtrans (mengirim notifikasi transaction_status:
      // "expire" ke webhook kita) — sesuai keputusan produk: tidak perlu
      // status "pending" yang menggantung lama, kalau lewat waktu ya hangus.
      expiry: {
        unit: "minutes",
        duration: 10,
      },
    };

    const basicAuth = Buffer.from(`${serverKey}:`).toString("base64");

    const snapRes = await fetch(SNAP_BASE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(snapBody),
    });

    const snapJson = await snapRes.json();

    if (!snapRes.ok) {
      console.error("[postCreateTransaction] Midtrans error:", snapJson);
      return res.status(snapRes.status).json({
        error: snapJson.error_messages?.join(", ") ?? "Gagal membuat transaksi.",
      });
    }

    await createOrder({
      orderId,
      userId: req.userId, // di-set oleh middleware requireAuth — checkout wajib login
      productId,
      size,
      color,
      quantity,
      pricePerItem,
      shippingCost,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
    });

    res.json({ token: snapJson.token, orderId });
  } catch (err) {
    console.error("[postCreateTransaction] error:", err);
    res.status(500).json({ error: "Gagal membuat transaksi pembayaran." });
  }
}

/**
 * Webhook notifikasi Midtrans. Midtrans yang panggil endpoint ini
 * (bukan frontend), jadi statusnya jadi sumber kebenaran transaksi.
 *
 * Daftarkan URL endpoint ini di Midtrans Dashboard > Settings >
 * Configuration > Payment Notification URL.
 */
export async function postMidtransNotification(req, res) {
  try {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order tidak ditemukan." });
    }

    let newStatus = order.status;

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || !fraudStatus) {
        newStatus = "paid";
      }
    } else if (transactionStatus === "pending") {
      newStatus = "pending";
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      newStatus = transactionStatus === "expire" ? "expired" : "failed";
    }

    // Kurangi stok hanya saat transisi pertama kali ke 'paid', supaya
    // notifikasi duplikat dari Midtrans tidak mengurangi stok dua kali.
    if (newStatus === "paid" && order.status !== "paid") {
      await decrementStock(order.product_id, order.size, order.quantity);
    }

    await updateOrderStatus(orderId, newStatus, notification.transaction_id);

    res.status(200).json({ message: "Notifikasi diterima." });
  } catch (err) {
    console.error("[postMidtransNotification] error:", err);
    res.status(500).json({ error: "Gagal memproses notifikasi." });
  }
}

export async function getOrderStatus(req, res) {
  try {
    const order = await findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order tidak ditemukan." });
    }
    res.json({ data: order });
  } catch (err) {
    console.error("[getOrderStatus] error:", err);
    res.status(500).json({ error: "Gagal mengambil status order." });
  }
}

// Riwayat pembayaran user yang sedang login — dipakai halaman
// /profile#riwayat. req.userId di-set oleh middleware requireAuth.
export async function getOrderHistory(req, res) {
  try {
    const orders = await findOrdersByUserId(req.userId);
    res.json({ data: orders });
  } catch (err) {
    console.error("[getOrderHistory] error:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat pembayaran." });
  }
}