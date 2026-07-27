// Helper tipis untuk panggil RajaOngkir Komerce API.
// File ini hanya jalan di server Express, jadi RAJAONGKIR_API_KEY aman
// dari browser.

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";

function getApiKey() {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) {
    throw new Error("RAJAONGKIR_API_KEY belum diset. Tambahkan di file .env.");
  }
  return key;
}

/**
 * Cari kota/kecamatan berdasarkan nama keyword.
 * Dipakai untuk autocomplete input alamat tujuan di form cek ongkir.
 */
export async function searchDestination(keyword) {
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
 * Hitung ongkos kirim antar dua titik untuk satu kurir.
 */
export async function calculateShippingCost({ origin, destination, weight, courier }) {
  const body = new URLSearchParams({
    origin,
    destination,
    weight: String(weight),
    courier,
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

  const options = (json.data ?? []).map((item) => ({
    service: item.service,
    description: item.description,
    cost: item.cost,
    etd: item.etd,
  }));

  return { courier, options };
}
