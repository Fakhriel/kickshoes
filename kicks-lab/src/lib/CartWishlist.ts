// Util terpusat untuk operasi keranjang & wishlist ke backend (kicks-api).
// Dipakai bersama oleh ProductGrid.astro, pages/produk/[slug].astro, dan
// pages/profile.astro supaya tidak ada logika fetch yang terduplikasi/beda
// perilaku di tempat berbeda.

import { apiFetch } from "./AuthState";

export interface CartItem {
  cartItemId: string;
  product_id: string;
  size: string;
  color: string | null;
  quantity: number;
  addedAt: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

export interface WishlistItem {
  wishlistId: string;
  addedAt: string;
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  badge: "Baru" | "Diskon" | "Terlaris" | null;
  image: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseJsonOrThrow(res: Response): Promise<any> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json.error ?? "Terjadi kesalahan. Coba lagi.", res.status);
  }
  return json;
}

// ============ CART ============

export async function getCart(apiUrl: string): Promise<CartItem[]> {
  const res = await apiFetch(`${apiUrl}/api/cart`);
  const json = await parseJsonOrThrow(res);
  return json.data ?? [];
}

export async function addToCart(
  apiUrl: string,
  payload: { productId: string; size: string; color?: string | null; quantity?: number }
): Promise<void> {
  const res = await apiFetch(`${apiUrl}/api/cart`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await parseJsonOrThrow(res);
}

export async function updateCartItemQty(
  apiUrl: string,
  cartItemId: string,
  quantity: number
): Promise<void> {
  const res = await apiFetch(`${apiUrl}/api/cart/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  await parseJsonOrThrow(res);
}

export async function removeCartItem(apiUrl: string, cartItemId: string): Promise<void> {
  const res = await apiFetch(`${apiUrl}/api/cart/${cartItemId}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}

// ============ WISHLIST ============

export async function getWishlist(apiUrl: string): Promise<WishlistItem[]> {
  const res = await apiFetch(`${apiUrl}/api/wishlist`);
  const json = await parseJsonOrThrow(res);
  return json.data ?? [];
}

export async function addToWishlist(apiUrl: string, productId: string): Promise<void> {
  const res = await apiFetch(`${apiUrl}/api/wishlist`, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  await parseJsonOrThrow(res);
}

export async function removeFromWishlist(apiUrl: string, productId: string): Promise<void> {
  const res = await apiFetch(`${apiUrl}/api/wishlist/${productId}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}

// ============ RIWAYAT PEMBAYARAN ============

export interface OrderHistoryItem {
  orderId?: string;
  order_id?: string;
  status: string;
  totalAmount?: number;
  total_amount?: number;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

export async function getOrderHistory(apiUrl: string): Promise<OrderHistoryItem[]> {
  const res = await apiFetch(`${apiUrl}/api/payment/riwayat`);
  const json = await parseJsonOrThrow(res);
  return json.data ?? [];
}