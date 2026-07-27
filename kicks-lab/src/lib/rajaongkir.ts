// Helper tipis untuk panggil RajaOngkir Komerce API dari server (Astro API route).
// JANGAN pernah import file ini dari komponen yang jalan di browser —
// RAJAONGKIR_API_KEY hanya boleh terbaca di server.

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";

export interface OngkirCostRequest {
  origin: string; // ID kota/kecamatan asal (gudang toko)
  destination: string; // ID kota/kecamatan tujuan (input dari pembeli)
  weight: number; // dalam gram
  courier: string; // contoh: "jne", "jnt", "sicepat"
}

export interface OngkirCostOption {
  service: string; // contoh: "REG", "YES", "OKE"
  description: string;
  cost: number;
  etd: string; // estimasi hari, contoh: "2-3"
}

export interface OngkirCostResult {
  courier: string;
  options: OngkirCostOption[];
}

function getApiKey(): string {
  const key = import.meta.env.RAJAONGKIR_API_KEY;
  if (!key) {
    throw new Error(
      "RAJAONGKIR_API_KEY belum diset. Tambahkan di file .env (lihat .env.example)."
    );
  }
  return key;
}

/**
 * Cari kota/kecamatan berdasarkan nama keyword.
 * Dipakai untuk autocomplete input alamat tujuan di form cek ongkir.
 */
export async function searchDestination(keyword: string) {
  const url = `${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(
    keyword
  )}&limit=10`;

  const res = await fetch(url, {
    headers: { key: getApiKey() },
  });

  if (!res.ok) {
    throw new Error(`RajaOngkir destination search gagal: ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? [];
}

/**
 * Hitung ongkos kirim antar dua titik untuk satu atau beberapa kurir.
 */
export async function calculateShippingCost(
  params: OngkirCostRequest
): Promise<OngkirCostResult> {
  const body = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    weight: String(params.weight),
    courier: params.courier,
  });

  const res = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
    method: "POST",
    headers: {
      key: getApiKey(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`RajaOngkir calculate cost gagal: ${res.status}`);
  }

  const json = await res.json();

  const options: OngkirCostOption[] = (json.data ?? []).map((item: any) => ({
    service: item.service,
    description: item.description,
    cost: item.cost,
    etd: item.etd,
  }));

  return { courier: params.courier, options };
}