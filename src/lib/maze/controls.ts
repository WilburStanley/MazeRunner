import type { Direction } from "./grid";

// A Map, not a plain object, so keys like "constructor" can't match by accident
const KEY_DIRECTIONS = new Map<string, Direction>([
  ["w", "north"],
  ["arrowup", "north"],
  ["a", "west"],
  ["arrowleft", "west"],
  ["s", "south"],
  ["arrowdown", "south"],
  ["d", "east"],
  ["arrowright", "east"],
]);

export const keyToDirection = (key: string): Direction | null =>
  KEY_DIRECTIONS.get(key.toLowerCase()) ?? null;

// Turns a drag vector into a direction; ties go to the horizontal axis
export const vectorToDirection = (
  deltaX: number,
  deltaY: number,
  deadZone: number,
): Direction | null => {
  if (Math.hypot(deltaX, deltaY) < deadZone) return null;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) return deltaX > 0 ? "east" : "west";
  return deltaY > 0 ? "south" : "north";
};