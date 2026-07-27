import {
  findWishlistByUserId,
  addToWishlist,
  removeFromWishlist,
} from "../db/wishlistQueries.js";

// req.userId di semua fungsi ini di-set oleh middleware requireAuth —
// seluruh route wishlist wajib login (lihat routes/wishlist.js).

export async function getWishlist(req, res) {
  try {
    const items = await findWishlistByUserId(req.userId);
    res.json({ data: items });
  } catch (err) {
    console.error("[getWishlist] error:", err);
    res.status(500).json({ error: "Gagal mengambil wishlist." });
  }
}

export async function postWishlistItem(req, res) {
  try {
    const { productId } = req.body ?? {};
    if (!productId) {
      return res.status(400).json({ error: "productId wajib diisi." });
    }

    await addToWishlist(req.userId, productId);
    res.status(201).json({ message: "Ditambahkan ke wishlist." });
  } catch (err) {
    console.error("[postWishlistItem] error:", err);
    res.status(500).json({ error: "Gagal menambahkan ke wishlist." });
  }
}

export async function deleteWishlistItem(req, res) {
  try {
    const { productId } = req.params;
    await removeFromWishlist(req.userId, productId);
    res.json({ message: "Dihapus dari wishlist." });
  } catch (err) {
    console.error("[deleteWishlistItem] error:", err);
    res.status(500).json({ error: "Gagal menghapus dari wishlist." });
  }
}