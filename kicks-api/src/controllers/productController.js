import {
  findAllProducts,
  findProductById,
  findProductBySlug,
  findAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../db/productQueries.js";

export async function getProducts(req, res) {
  try {
    const { gender, badge, sort, q, limit } = req.query;
    const products = await findAllProducts({ gender, badge, sort, q, limit });
    res.json({ data: products });
  } catch (err) {
    console.error("[getProducts] error:", err);
    res.status(500).json({ error: "Gagal mengambil daftar produk." });
  }
}


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

// ============================================================
// ENDPOINT DASHBOARD ADMIN — semua dilindungi requireAdmin
// (lihat routes/products.js)
// ============================================================

export async function getProductsForAdmin(req, res) {
  try {
    const products = await findAllProductsForAdmin();
    res.json({ data: products });
  } catch (err) {
    console.error("[getProductsForAdmin] error:", err);
    res.status(500).json({ error: "Gagal mengambil daftar produk." });
  }
}

const GENDER_VALUES = ["pria", "wanita"];
const BADGE_VALUES = ["Baru", "Diskon", "Terlaris"];

// Validasi & normalisasi input yang dipakai bersama create & update —
// supaya aturan validasinya tidak bisa "ngedrift" beda antara keduanya.
function validateProductInput(body) {
  const errors = [];

  const name = String(body.name ?? "").trim();
  if (!name) errors.push("Nama produk wajib diisi.");

  const category = String(body.category ?? "").trim();
  if (!category) errors.push("Kategori wajib diisi.");

  const gender = body.gender;
  if (!GENDER_VALUES.includes(gender)) {
    errors.push("Gender harus 'pria' atau 'wanita'.");
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    errors.push("Harga harus angka lebih dari 0.");
  }

  let originalPrice = null;
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== "") {
    originalPrice = Number(body.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      errors.push("Harga coret harus angka lebih dari 0 (atau dikosongkan).");
    }
  }

  let badge = null;
  if (body.badge) {
    if (!BADGE_VALUES.includes(body.badge)) {
      errors.push("Badge tidak valid.");
    } else {
      badge = body.badge;
    }
  }

  const description = String(body.description ?? "").trim();
  if (!description) errors.push("Deskripsi wajib diisi.");

  const images = Array.isArray(body.images)
    ? body.images.map((url) => String(url).trim()).filter(Boolean)
    : [];
  if (images.length === 0) errors.push("Minimal 1 gambar (URL) wajib diisi.");

  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .map((s) => ({ size: String(s.size ?? "").trim(), stock: Number(s.stock) }))
        .filter((s) => s.size)
    : [];
  if (sizes.length === 0) {
    errors.push("Minimal 1 ukuran wajib diisi.");
  } else if (sizes.some((s) => !Number.isFinite(s.stock) || s.stock < 0)) {
    errors.push("Stok tiap ukuran harus angka 0 atau lebih.");
  }

  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

  return {
    errors,
    value: { name, category, gender, price, originalPrice, badge, description, images, sizes, isActive },
  };
}

export async function postProduct(req, res) {
  try {
    const { errors, value } = validateProductInput(req.body ?? {});
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    const result = await createProduct(value);
    res.status(201).json({ data: result, message: "Produk berhasil ditambahkan." });
  } catch (err) {
    console.error("[postProduct] error:", err);
    res.status(500).json({ error: "Gagal menambahkan produk." });
  }
}

export async function patchProduct(req, res) {
  try {
    const { id } = req.params;
    const { errors, value } = validateProductInput(req.body ?? {});
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    const result = await updateProduct(id, value);
    if (!result) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    res.json({ data: result, message: "Produk berhasil diperbarui." });
  } catch (err) {
    console.error("[patchProduct] error:", err);
    res.status(500).json({ error: "Gagal memperbarui produk." });
  }
}

export async function removeProduct(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    res.json({ message: "Produk berhasil dihapus." });
  } catch (err) {
    
    if (err.errno === 1451) {
      return res.status(409).json({
        error: "Produk ini tidak bisa dihapus karena sudah pernah dibeli pelanggan. Nonaktifkan saja produknya, jangan dihapus.",
      });
    }
    console.error("[removeProduct] error:", err);
    res.status(500).json({ error: "Gagal menghapus produk." });
  }
}