// Layer query untuk tabel produk dan semua tabel relasinya.
// Semua query pakai prepared statement (placeholder `?`) supaya aman
// dari SQL injection — JANGAN pernah concat input user langsung ke SQL string.

import { pool } from "../config/database.js";

const VALID_SORTS = {
  terbaru: "p.created_at DESC",
  "harga-rendah": "p.price ASC",
  "harga-tinggi": "p.price DESC",
};

/**
 * Ambil daftar produk untuk grid/katalog.
 * Sengaja tidak ikut JOIN semua relasi (images, sizes, dst) karena
 * grid cuma butuh 1 foto cover + info ringkas.
 *
 * @param {Object} filters
 * @param {string} [filters.gender] - 'pria' | 'wanita'
 * @param {string} [filters.badge] - filter badge spesifik, contoh 'Baru'
 * @param {string} [filters.sort] - 'terbaru' (default) | 'harga-rendah' | 'harga-tinggi'
 * @param {string} [filters.q] - kata kunci pencarian (cocok ke nama & kategori produk)
 * @param {number} [filters.limit] - batas jumlah hasil (dipakai search bar di navbar)
 */
export async function findAllProducts(filters = {}) {
  const { gender, badge, sort, q, limit } = filters;
  const conditions = ["p.is_active = 1"];
  const params = [];

  if (gender === "pria" || gender === "wanita") {
    conditions.push("p.gender = ?");
    params.push(gender);
  }

  if (badge) {
    conditions.push("p.badge = ?");
    params.push(badge);
  }

  // Pencarian sederhana: cocokkan kata kunci ke nama ATAU kategori produk.
  // Dipakai oleh search bar di Navbar (GET /api/products?q=...).
  const keyword = typeof q === "string" ? q.trim() : "";
  if (keyword) {
    conditions.push("(p.name LIKE ? OR p.category LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const orderBy = VALID_SORTS[sort] || VALID_SORTS.terbaru;

  // LIMIT tidak bisa dikirim sebagai placeholder `?` biasa di semua driver
  // mysql2 secara konsisten, jadi divalidasi & dirender manual sebagai integer murni.
  const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
    ? Math.min(Number(limit), 50)
    : null;
  const limitClause = safeLimit ? ` LIMIT ${safeLimit}` : "";

  const [rows] = await pool.query(
    `SELECT
        p.id,
        p.slug,
        p.name,
        p.category,
        p.gender,
        p.price,
        p.original_price AS originalPrice,
        p.badge,
        p.created_at AS createdAt,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image,
        (
          SELECT ps.size
          FROM product_sizes ps
          WHERE ps.product_id = p.id AND ps.stock > 0
          ORDER BY ps.sort_order ASC
          LIMIT 1
        ) AS firstAvailableSize
     FROM products p
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}${limitClause}`,
    params
  );
  return rows;
}


async function findProductByColumn(column, value) {
  const [productRows] = await pool.query(
    `SELECT
        id, slug, name, category, gender, price,
        original_price AS originalPrice,
        badge, weight_gram AS weightGram, description
     FROM products
     WHERE ${column} = ? AND is_active = 1
     LIMIT 1`,
    [value]
  );

  const product = productRows[0];
  if (!product) return null;

  const id = product.id;

  const [images, highlights, colors, sizes, chartHeaderRows, chartRows] =
    await Promise.all([
      pool.query(
        `SELECT image_url AS url FROM product_images
         WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      ),
      pool.query(
        `SELECT content FROM product_highlights
         WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      ),
      pool.query(
        `SELECT name, hex_code AS hex, image_url AS image FROM product_colors
         WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      ),
      pool.query(
        `SELECT size, stock FROM product_sizes
         WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      ),
      pool.query(
        `SELECT headers FROM product_size_chart_headers WHERE product_id = ?`,
        [id]
      ),
      pool.query(
        `SELECT row_data FROM product_size_chart_rows
         WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      ),
    ]);

  // Kolom JSON di MySQL kadang dikembalikan sebagai string mentah oleh
  // mysql2 (tergantung versi server), jadi parse manual di sini supaya
  // shape responsnya konsisten array JS, bukan string JSON ganda.
  const parseJsonColumn = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  };

  const headersRaw = chartHeaderRows[0][0]?.headers ?? [];

  return {
    ...product,
    images: images[0].map((row) => row.url),
    highlights: highlights[0].map((row) => row.content),
    colors: colors[0],
    sizes: sizes[0],
    sizeChart: {
      headers: parseJsonColumn(headersRaw),
      rows: chartRows[0].map((row) => parseJsonColumn(row.row_data)),
    },
  };
}


export async function findProductById(id) {
  return findProductByColumn("id", id);
}


export async function findProductBySlug(slug) {
  return findProductByColumn("slug", slug);
}


export async function findSizeStock(productId, size) {
  const [rows] = await pool.query(
    `SELECT stock FROM product_sizes WHERE product_id = ? AND size = ? LIMIT 1`,
    [productId, size]
  );
  return rows[0]?.stock ?? null;
}


export async function decrementStock(productId, size, quantity) {
  const [result] = await pool.query(
    `UPDATE product_sizes
     SET stock = stock - ?
     WHERE product_id = ? AND size = ? AND stock >= ?`,
    [quantity, productId, size, quantity]
  );
  return result.affectedRows > 0;
}

// ============================================================
// CRUD UNTUK DASHBOARD ADMIN
// ============================================================

function generateProductId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `p-${Date.now().toString(36)}${random}`;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Daftar produk untuk tabel di dashboard admin — beda dari
 * findAllProducts (yang untuk katalog publik): ini TIDAK memfilter
 * is_active, supaya produk nonaktif tetap kelihatan & bisa diaktifkan
 * lagi dari dashboard. Juga ikut hitung total stok semua ukuran.
 */
export async function findAllProductsForAdmin() {
  const [rows] = await pool.query(
    `SELECT
        p.id,
        p.slug,
        p.name,
        p.category,
        p.gender,
        p.price,
        p.original_price AS originalPrice,
        p.badge,
        p.is_active AS isActive,
        p.created_at AS createdAt,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image,
        (
          SELECT COALESCE(SUM(ps.stock), 0)
          FROM product_sizes ps
          WHERE ps.product_id = p.id
        ) AS totalStock
     FROM products p
     ORDER BY p.created_at DESC`
  );
  return rows;
}

/**
 * Buat produk baru beserta gambar & ukurannya dalam SATU transaksi —
 * kalau salah satu langkah gagal (mis. insert ukuran gagal), semuanya
 * di-rollback supaya tidak ada produk "setengah jadi" (ada di tabel
 * products tapi tanpa gambar/ukuran) yang nyangkut di database.
 *
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.category
 * @param {'pria'|'wanita'} input.gender
 * @param {number} input.price
 * @param {number|null} input.originalPrice
 * @param {string} input.description
 * @param {boolean} input.isActive
 * @param {string[]} input.images - minimal 1 URL gambar
 * @param {{size: string, stock: number}[]} input.sizes - minimal 1 ukuran
 */
export async function createProduct(input) {
  const id = generateProductId();
  const baseSlug = slugify(input.name) || id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Pastikan slug unik — kalau sudah ada produk dengan slug yang
    // sama persis, tambahkan suffix angka (sama seperti
    // scripts/generate-slugs.js menangani nama yang mirip).
    const [slugRows] = await connection.query(
      `SELECT slug FROM products WHERE slug LIKE ?`,
      [`${baseSlug}%`]
    );
    const usedSlugs = new Set(slugRows.map((r) => r.slug));
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    await connection.query(
      `INSERT INTO products
        (id, slug, name, category, gender, price, original_price, badge, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        input.name,
        input.category,
        input.gender,
        input.price,
        input.originalPrice ?? null,
        input.badge ?? null,
        input.description,
        input.isActive ? 1 : 0,
      ]
    );

    for (let i = 0; i < input.images.length; i++) {
      await connection.query(
        `INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)`,
        [id, input.images[i], i]
      );
    }

    for (let i = 0; i < input.sizes.length; i++) {
      await connection.query(
        `INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES (?, ?, ?, ?)`,
        [id, input.sizes[i].size, input.sizes[i].stock, i]
      );
    }

    await connection.commit();
    return { id, slug };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateProduct(id, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT id FROM products WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existingRows.length === 0) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `UPDATE products SET
        name = ?, category = ?, gender = ?, price = ?,
        original_price = ?, badge = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [
        input.name,
        input.category,
        input.gender,
        input.price,
        input.originalPrice ?? null,
        input.badge ?? null,
        input.description,
        input.isActive ? 1 : 0,
        id,
      ]
    );

    if (Array.isArray(input.images)) {
      await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);
      for (let i = 0; i < input.images.length; i++) {
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)`,
          [id, input.images[i], i]
        );
      }
    }

    if (Array.isArray(input.sizes)) {
      await connection.query(`DELETE FROM product_sizes WHERE product_id = ?`, [id]);
      for (let i = 0; i < input.sizes.length; i++) {
        await connection.query(
          `INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES (?, ?, ?, ?)`,
          [id, input.sizes[i].size, input.sizes[i].stock, i]
        );
      }
    }

    await connection.commit();
    return { id };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function deleteProduct(id) {
  const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}