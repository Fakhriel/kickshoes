import { findAllProducts, findProductById, findProductBySlug } from "../db/productQueries.js";

export async function getProducts(req, res) {
  try {
    const { gender, badge, sort } = req.query;
    const products = await findAllProducts({ gender, badge, sort });
    res.json({ data: products });
  } catch (err) {
    console.error("[getProducts] error:", err);
    res.status(500).json({ error: "Gagal mengambil daftar produk." });
  }
}

// Dipertahankan untuk kebutuhan internal (mis. dashboard admin nanti
// yang lebih natural kerja pakai id daripada slug).
export async function getProductDetail(req, res) {
  try {
    const { id } = req.params;
    const product = await findProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    res.json({ data: product });
  } catch (err) {
    console.error("[getProductDetail] error:", err);
    res.status(500).json({ error: "Gagal mengambil detail produk." });
  }
}

// Endpoint publik yang dipakai halaman /produk/[slug] di frontend.
export async function getProductDetailBySlug(req, res) {
  try {
    const { slug } = req.params;
    const product = await findProductBySlug(slug);

    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    res.json({ data: product });
  } catch (err) {
    console.error("[getProductDetailBySlug] error:", err);
    res.status(500).json({ error: "Gagal mengambil detail produk." });
  }
}

