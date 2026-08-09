/**
 * Deterministic PRNG so the statically exported HTML and the hydrated client
 * always agree. Never swap this for Math.random().
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;

  const float = (min: number, max: number) => next() * (max - min) + min;

  const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)];

  const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return entries[entries.length - 1][0];
  };

  const bool = (probability = 0.5) => next() < probability;

  const sample = <T>(items: readonly T[], count: number): T[] => {
    const pool = [...items];
    const out: T[] = [];
    for (let i = 0; i < count && pool.length > 0; i += 1) {
      out.push(pool.splice(int(0, pool.length - 1), 1)[0]);
    }
    return out;
  };

  return { next, int, float, pick, weighted, bool, sample };
}

export type Random = ReturnType<typeof createRandom>;
