const STATE_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 4294967296; // 2 ** 32

// mulberry32: tiny seeded PRNG, same seed -> same sequence
export const mulberry32 = (seed: number): (() => number) => {
  let state = seed | 0;
  return () => {
    state = (state + STATE_INCREMENT) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
};