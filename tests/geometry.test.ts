import { describe, it, expect } from "vitest";
import { computeGeometry } from "../src/lib/render/geometry";

const MAZE_SIZES = [5, 11, 21, 31, 41, 51];
const PIXEL_SIZES = [240, 360, 390, 720, 1170, 1600, 2400];

describe("computeGeometry", () => {
  it("uses whole pixels for the cell and wall width", () => {
    for (const mazeSize of MAZE_SIZES) {
      for (const pixelSize of PIXEL_SIZES) {
        const { cell, wallWidth, origin } = computeGeometry(pixelSize, mazeSize);
        expect(Number.isInteger(cell)).toBe(true);
        expect(Number.isInteger(wallWidth)).toBe(true);
        expect(Number.isInteger(origin)).toBe(true);
      }
    }
  });

  it("keeps the whole maze, including wall thickness, inside the canvas", () => {
    for (const mazeSize of MAZE_SIZES) {
      for (const pixelSize of PIXEL_SIZES) {
        const { cell, wallWidth, origin } = computeGeometry(pixelSize, mazeSize);
        const mazeSpan = cell * mazeSize;
        expect(origin - wallWidth / 2).toBeGreaterThanOrEqual(0);
        expect(origin + mazeSpan + wallWidth / 2).toBeLessThanOrEqual(pixelSize);
      }
    }
  });

  it("centres the maze", () => {
    const { cell, origin } = computeGeometry(1000, 21);
    const leftGap = origin;
    const rightGap = 1000 - (origin + cell * 21);
    expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
  });

  it("never draws a wall thinner than one pixel", () => {
    expect(computeGeometry(240, 51).wallWidth).toBeGreaterThanOrEqual(1);
  });
});