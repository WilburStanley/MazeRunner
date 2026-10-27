import { describe, it, expect } from "vitest";
import { generateMaze, generateMazeFromId } from "../src/lib/maze/generate";
import {
  DIRECTIONS,
  OPPOSITE_DIRECTION,
  getEndPosition,
  getNeighbor,
  getStartPosition,
  isInsideMaze,
  type Maze,
} from "../src/lib/maze/grid";
import { ALGORITHMS, encodeId } from "../src/lib/maze/id";
import { findShortestPath } from "../src/lib/maze/solve";

const SAMPLE_SEEDS = [0, 1, 7, 12345, 987654, 1073741823];
const SAMPLE_SIZES = [5, 10, 21, 51];

const countPassages = (maze: Maze): number => {
  let openSides = 0;
  for (const row of maze.cells) {
    for (const cell of row) {
      for (const direction of DIRECTIONS) {
        if (!cell[direction]) openSides++;
      }
    }
  }
  return openSides / 2; // every passage is open from both sides
};

describe("generateMaze", () => {
  it("is deterministic: same spec gives an identical maze", () => {
    for (const algorithm of ALGORITHMS) {
      const spec = { algorithm, size: 21, seed: 12345 };
      expect(generateMaze(spec)).toEqual(generateMaze(spec));
    }
  });

  it("gives different mazes for different seeds", () => {
    for (const algorithm of ALGORITHMS) {
      const first = generateMaze({ algorithm, size: 21, seed: 1 });
      const second = generateMaze({ algorithm, size: 21, seed: 2 });
      expect(first).not.toEqual(second);
    }
  });

  it("is always solvable from start to finish (BFS)", () => {
    for (const algorithm of ALGORITHMS) {
      for (const size of SAMPLE_SIZES) {
        for (const seed of SAMPLE_SEEDS) {
          const maze = generateMaze({ algorithm, size, seed });
          const path = findShortestPath(maze);
          expect(path, `${algorithm} size ${size} seed ${seed}`).not.toBeNull();
          expect(path![0]).toEqual(getStartPosition());
          expect(path![path!.length - 1]).toEqual(getEndPosition(maze));
        }
      }
    }
  });

  it("is a perfect maze: exactly cells - 1 passages, so no loops", () => {
    for (const algorithm of ALGORITHMS) {
      for (const size of SAMPLE_SIZES) {
        const maze = generateMaze({ algorithm, size, seed: 987654 });
        expect(countPassages(maze)).toBe(size * size - 1);
      }
    }
  });

  it("keeps walls consistent on both sides and the outer border closed", () => {
    for (const algorithm of ALGORITHMS) {
      const maze = generateMaze({ algorithm, size: 21, seed: 12345 });
      for (let row = 0; row < maze.size; row++) {
        for (let column = 0; column < maze.size; column++) {
          for (const direction of DIRECTIONS) {
            const position = { row, column };
            const neighbor = getNeighbor(position, direction);
            const hasWall = maze.cells[row][column][direction];
            if (isInsideMaze(maze, neighbor)) {
              const neighborWall =
                maze.cells[neighbor.row][neighbor.column][OPPOSITE_DIRECTION[direction]];
              expect(hasWall).toBe(neighborWall);
            } else {
              expect(hasWall).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe("generateMazeFromId", () => {
  it("builds the same maze as the spec it encodes", () => {
    const spec = { algorithm: "K" as const, size: 21, seed: 12345 };
    expect(generateMazeFromId(encodeId(spec))).toEqual(generateMaze(spec));
  });

  it("returns null for an invalid id", () => {
    expect(generateMazeFromId("not-an-id")).toBeNull();
  });
});