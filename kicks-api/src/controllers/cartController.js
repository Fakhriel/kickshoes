import {
  findCartByUserId,
  addOrIncrementCartItem,
  updateCartItemQuantity,
  removeCartItem,
} from "../db/cartQueries.js";
import { findProductById, findSizeStock } from "../db/productQueries.js";

// req.userId di semua fungsi ini di-set oleh middleware requireAuth —
// seluruh route keranjang wajib login (lihat routes/cart.js).

export async function getCart(req, res) {
  try {
    const items = await findCartByUserId(req.userId);
    res.json({ data: items });
  } catch (err) {
    console.error("[getCart] error:", err);
    res.status(500).json({ error: "Gagal mengambil keranjang." });
  }
}

export async function postCartItem(req, res) {
  try {
    const { productId, size, color, quantity } = req.body ?? {};

    if (!productId || !size) {
      return res.status(400).json({ error: "productId dan size wajib diisi." });
    }

    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    // Validasi produk & ukuran benar-benar ada — sama seperti validasi
    // di paymentController, jangan percaya input mentah dari frontend.
    const product = await findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    const stock = await findSizeStock(productId, size);
    if (stock === null) {
      return res.status(400).json({ error: "Ukuran tidak tersedia untuk produk ini." });
    }
    if (stock < qty) {
      return res.status(409).json({
        error: `Stok tidak cukup. Tersisa ${stock} pasang untuk ukuran ${size}.`,
      });
    }

    await addOrIncrementCartItem({
      userId: req.userId,
      productId,
      size,
      color: color ?? null,
      quantity: qty,
    });

    res.status(201).json({ message: "Ditambahkan ke keranjang." });
  } catch (err) {
    console.error("[postCartItem] error:", err);
    res.status(500).json({ error: "Gagal menambahkan ke keranjang." });
  }
}

export async function patchCartItem(req, res) {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body ?? {};

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ error: "quantity harus angka positif." });
    }

    await updateCartItemQuantity(req.userId, cartItemId, qty);
    res.json({ message: "Keranjang diperbarui." });
  } catch (err) {
    console.error("[patchCartItem] error:", err);
    res.status(500).json({ error: "Gagal memperbarui keranjang." });
  }
}

export async function deleteCartItem(req, res) {
  try {
    const { cartItemId } = req.params;
    await removeCartItem(req.userId, cartItemId);
    res.json({ message: "Item dihapus dari keranjang." });
  } catch (err) {
    console.error("[deleteCartItem] error:", err);
    res.status(500).json({ error: "Gagal menghapus item." });
  }
}