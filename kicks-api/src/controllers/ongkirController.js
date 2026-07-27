import { searchDestination, calculateShippingCost } from "../utils/rajaongkir.js";

const WAREHOUSE_ORIGIN_ID = process.env.RAJAONGKIR_ORIGIN_ID || "501";

export async function getDestinations(req, res) {
  const keyword = req.query.q?.trim();

  if (!keyword || keyword.length < 3) {
    return res.json({ data: [] });
  }

  try {
    const data = await searchDestination(keyword);
    res.json({ data });
  } catch (err) {
    console.error("[getDestinations] error:", err);
    res.status(500).json({ error: "Gagal mencari destinasi." });
  }
}

export async function postCalculateCost(req, res) {
  try {
    const { destination, weight, courier } = req.body ?? {};

    if (!destination || !weight || !courier) {
      return res.status(400).json({
        error: "Parameter destination, weight, dan courier wajib diisi.",
      });
    }

    const result = await calculateShippingCost({
      origin: WAREHOUSE_ORIGIN_ID,
      destination: String(destination),
      weight: Number(weight),
      courier: String(courier),
    });

    res.json(result);
  } catch (err) {
    console.error("[postCalculateCost] error:", err);
    res.status(500).json({ error: "Gagal mengambil data ongkir. Coba lagi." });
  }
}
