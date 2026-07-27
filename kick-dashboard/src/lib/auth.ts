// Auth helper untuk dashboard admin — terhubung ke kicks-api asli
// (endpoint /api/admin-auth). Token JWT disimpan di sessionStorage
// (BUKAN localStorage) sengaja, supaya sesi admin otomatis berakhir
// saat tab/browser ditutup — lebih aman untuk akses dashboard internal
// dibanding sesi customer biasa yang boleh "tetap masuk" lama.

const TOKEN_KEY = "stride:admin-token";
const ADMIN_KEY = "stride:admin-user";

export interface AdminUser {
  id: string;
  username: string;
  name: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  token: string | null;
}

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:4000";

export function getAdminAuth(): AdminAuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, admin: null, token: null };
  }

  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    const rawAdmin = window.sessionStorage.getItem(ADMIN_KEY);

    if (!token || !rawAdmin) {
      return { isAuthenticated: false, admin: null, token: null };
    }

    const admin = JSON.parse(rawAdmin) as AdminUser;
    return { isAuthenticated: true, admin, token };
  } catch {
    return { isAuthenticated: false, admin: null, token: null };
  }
}

export function setAdminAuth(token: string, admin: AdminUser): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminAuth(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(ADMIN_KEY);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

// Login ke backend asli — menggantikan validateLogin() versi statis lama.
// Melempar Error dengan pesan dari backend kalau gagal, supaya UI bisa
// menampilkan pesan yang sama persis dengan yang dikirim server.
export async function loginAdmin(username: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? "Username atau password salah.");
  }

  setAdminAuth(json.data.token, json.data.admin);
  return json.data.admin;
}

// Wrapper fetch yang otomatis menyertakan header Authorization dengan
// token admin. Dipakai untuk SEMUA request ke endpoint /api/products
// (create/update/delete) dan endpoint admin lainnya nanti.
export async function adminApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  // Token admin tidak valid/kedaluwarsa — bersihkan sesi & lempar balik
  // ke login, supaya tidak ada layar dashboard "nyangkut" dengan data
  // yang gagal dimuat tanpa penjelasan ke admin.
  if (res.status === 401) {
    clearAdminAuth();
    window.location.replace("/login");
  }

  return res;
}

export { API_URL };