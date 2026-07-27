// Util status login — menyimpan JWT asli dari backend (kicks-api).
// Dipakai bersama oleh Navbar.astro dan profile.astro supaya status
// "sudah login" konsisten saat pindah halaman (full page navigation).
//
// Disimpan di localStorage (bukan sessionStorage) supaya login tetap
// tersimpan walau tab/browser ditutup — sama seperti kebiasaan umum
// e-commerce ("tetap masuk" antar sesi browser).

const TOKEN_KEY = "stride:token";
const USER_KEY = "stride:user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, token: null };
  }

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);

    if (!token || !rawUser) {
      return { isAuthenticated: false, user: null, token: null };
    }

    const user = JSON.parse(rawUser) as AuthUser;
    return { isAuthenticated: true, user, token };
  } catch {
    return { isAuthenticated: false, user: null, token: null };
  }
}

// Dipanggil setelah register/login berhasil dengan response asli dari
// backend ({ token, user }) — BUKAN dipakai untuk "pura-pura" login lagi.
export function setAuthenticated(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthenticated(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// Helper untuk dipakai komponen lain (mis. saat checkout) yang perlu
// mengirim token di header Authorization tanpa import getAuthState penuh.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

// Wrapper fetch yang otomatis menyertakan header Authorization kalau user
// sedang login. Dipakai untuk SEMUA request ke endpoint yang butuh login
// (cart, wishlist, payment) supaya tidak ada lagi kasus token lupa dikirim
// (penyebab bug "harus login lagi padahal sudah login").
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

// Dipanggil saat request ke endpoint yang butuh login mengembalikan 401 —
// artinya token tidak ada/tidak valid/kedaluwarsa. Membersihkan sesi lokal
// supaya UI (Navbar, dsb) konsisten kembali ke status "belum login".
export function handleUnauthorized(): void {
  clearAuthenticated();
}