import type { Direction } from "./grid";

// Direction keys currently held down, oldest first. The newest press wins, and
// letting go of it falls back to a key that is still held instead of stopping.
export type KeyStack = readonly Direction[];

export const pressKey = (stack: KeyStack, direction: Direction): KeyStack => [
  ...stack.filter((held) => held !== direction),
  direction,
];

export const releaseKey = (stack: KeyStack, direction: Direction): KeyStack =>
  stack.filter((held) => held !== direction);

// A touch input (pad or drag) overrides the keyboard while it is active
export const resolveActiveDirection = (
  keyStack: KeyStack,
  touchDirection: Direction | null,
): Direction | null => touchDirection ?? keyStack.at(-1) ?? null;