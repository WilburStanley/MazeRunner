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

export type RandomSource = () => number;

export const randomIntBelow = (nextRandom: RandomSource, upperBound: number): number =>
  Math.floor(nextRandom() * upperBound);

// Fisher-Yates shuffle, driven by the seeded source so it is repeatable
export const shuffleInPlace = <Item>(items: Item[], nextRandom: RandomSource): void => {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = randomIntBelow(nextRandom, index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
};