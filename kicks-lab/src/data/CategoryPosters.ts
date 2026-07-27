// Data poster kategori — dipakai di grid banner halaman Koleksi Baru (atas & bawah).
// Tiap poster mengarah ke halaman kategori (atau /pria, /wanita sebagai fallback filter gender).

export interface CategoryPoster {
  label: string;
  href: string;
  image: string;
}

export const categoryPostersTop: CategoryPoster[] = [
  {
    label: "Running",
    href: "/pria",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
  },
  {
    label: "Lifestyle",
    href: "/wanita",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&q=80",
  },
  {
    label: "Outdoor",
    href: "/pria",
    image: "https://images.unsplash.com/photo-1606890658317-7f14490ada3f?w=900&q=80",
  },
];

export const categoryPostersBottom: CategoryPoster[] = [
  {
    label: "Basketball",
    href: "/pria",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900&q=80",
  },
  {
    label: "Training",
    href: "/wanita",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=900&q=80",
  },
  {
    label: "Lifestyle",
    href: "/pria",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=80",
  },
];