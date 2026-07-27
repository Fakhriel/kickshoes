import { pool } from "../src/config/database.js";

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // hilangkan diakritik (é -> e, dst)
    .replace(/[^a-z0-9]+/g, "-") // karakter non-alfanumerik -> "-"
    .replace(/^-+|-+$/g, ""); // trim "-" di awal/akhir
}

async function run() {
  const [rows] = await pool.query(
    "SELECT id, name FROM products WHERE slug IS NULL OR slug = ''"
  );

  if (rows.length === 0) {
    console.log("[generate-slugs] Semua produk sudah punya slug, tidak ada yang diubah.");
  }

  // Lacak slug yang sudah dipakai (termasuk yang sudah ada di DB sebelumnya)
  // supaya kalau ada 2 produk dengan nama yang sama persis, slug kedua
  // otomatis dapat akhiran -2, -3, dst alih-alih bentrok UNIQUE constraint.
  const [existing] = await pool.query(
    "SELECT slug FROM products WHERE slug IS NOT NULL AND slug != ''"
  );
  const usedSlugs = new Set(existing.map((r) => r.slug));

  for (const product of rows) {
    let base = slugify(product.name) || product.id; // fallback kalau nama kosong/aneh
    let candidate = base;
    let suffix = 2;

    while (usedSlugs.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    usedSlugs.add(candidate);

    await pool.query("UPDATE products SET slug = ? WHERE id = ?", [
      candidate,
      product.id,
    ]);
    console.log(`[generate-slugs] ${product.id} -> "${candidate}"`);
  }

  console.log("[generate-slugs] Selesai. Sekarang jalankan ALTER TABLE untuk UNIQUE constraint:");
  console.log(`
  ALTER TABLE products
    MODIFY COLUMN slug VARCHAR(180) NOT NULL,
    ADD UNIQUE KEY uniq_products_slug (slug);
  `);

  await pool.end();
}

run().catch((err) => {
  console.error("[generate-slugs] Gagal:", err);
  process.exit(1);
});
