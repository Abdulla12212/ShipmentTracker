/** Anchors every relative timestamp so SSR HTML and client hydration agree. */
export const NOW = Date.UTC(2026, 7, 9, 16, 0, 0); // 2026-08-09 16:00 UTC

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

export const BRAND = {
  name: "Meridian",
  product: "Meridian Track",
  tagline: "Command-center logistics for global freight",
} as const;

export const STORAGE_KEYS = {
  dataset: "meridian.dataset.v1",
  theme: "meridian.theme",
  recent: "meridian.recent",
  demo: "meridian.demo",
  savedView: "meridian.savedView",
} as const;

export const SEED = 0x4d455249; // "MERI"
