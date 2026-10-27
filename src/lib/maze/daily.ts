import { ALGORITHMS, SEED_MAX, encodeId, type MazeSpec } from "./id";

const DAILY_SIZE = 21;
const DAILY_NAMESPACE = "maze-runner-daily";
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

// The daily maze changes at 00:00 UTC (08:00 in the Philippines)
export const getDailyDateKey = (date: Date): string => date.toISOString().slice(0, 10);

// FNV-1a: small, stable text hash, same result on every machine
const hashText = (text: string): number => {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
};

export const getDailySpec = (date: Date): MazeSpec => {
  const dateKey = getDailyDateKey(date);
  const algorithmHash = hashText(`${DAILY_NAMESPACE}:algorithm:${dateKey}`);
  const seedHash = hashText(`${DAILY_NAMESPACE}:seed:${dateKey}`);
  return {
    algorithm: ALGORITHMS[algorithmHash % ALGORITHMS.length],
    size: DAILY_SIZE,
    seed: seedHash % SEED_MAX,
  };
};

export const getDailyId = (date: Date): string => encodeId(getDailySpec(date));