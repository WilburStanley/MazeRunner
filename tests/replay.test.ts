import { describe, it, expect } from "vitest";
import { generateMaze } from "../src/lib/maze/generate";
import { DIRECTIONS, OPPOSITE_DIRECTION, getStartPosition } from "../src/lib/maze/grid";
import {
  MAX_MOVES,
  MAX_RUN_DURATION_MS,
  MIN_MS_PER_MOVE,
  isPlausibleDuration,
  replayMoves,
} from "../src/lib/maze/replay";
import { solveToMoves } from "./helpers";

const maze = generateMaze({ algorithm: "K", size: 21, seed: 12345 });
const shortestMoves = solveToMoves(maze);

describe("replayMoves", () => {
  it("accepts the shortest path", () => {
    expect(replayMoves(maze, shortestMoves)).toEqual({
      ok: true,
      moveCount: shortestMoves.length,
    });
  });

  it("accepts a run that steps back and forth", () => {
    const firstMove = shortestMoves[0];
    const wandering = [firstMove, OPPOSITE_DIRECTION[firstMove], ...shortestMoves];
    expect(replayMoves(maze, wandering)).toEqual({ ok: true, moveCount: wandering.length });
  });

  it("rejects a run that stops one move short", () => {
    expect(replayMoves(maze, shortestMoves.slice(0, -1))).toEqual({
      ok: false,
      reason: "did-not-reach-end",
    });
  });

  it("rejects an empty move list", () => {
    expect(replayMoves(maze, [])).toEqual({ ok: false, reason: "did-not-reach-end" });
  });

  it("rejects a move into a wall", () => {
    const start = getStartPosition();
    const blockedDirection = DIRECTIONS.find(
      (direction) => maze.cells[start.row][start.column][direction],
    )!;
    expect(replayMoves(maze, [blockedDirection])).toEqual({
      ok: false,
      reason: "blocked-by-wall",
    });
  });

  it("rejects malformed move lists", () => {
    for (const malformed of [null, undefined, "north", {}, [1], ["up"], [["north"]]]) {
      expect(replayMoves(maze, malformed)).toEqual({ ok: false, reason: "invalid-moves" });
    }
  });

  it("rejects a move list that is too long", () => {
    const tooManyMoves = new Array(MAX_MOVES + 1).fill("north");
    expect(replayMoves(maze, tooManyMoves)).toEqual({ ok: false, reason: "invalid-moves" });
  });
});

describe("isPlausibleDuration", () => {
  const moveCount = 100;

  it("rejects impossibly fast runs", () => {
    expect(isPlausibleDuration(moveCount, moveCount * MIN_MS_PER_MOVE - 1)).toBe(false);
    expect(isPlausibleDuration(moveCount, 0)).toBe(false);
  });

  it("accepts the fastest allowed time", () => {
    expect(isPlausibleDuration(moveCount, moveCount * MIN_MS_PER_MOVE)).toBe(true);
  });

  it("rejects runs older than the maximum duration", () => {
    expect(isPlausibleDuration(moveCount, MAX_RUN_DURATION_MS)).toBe(true);
    expect(isPlausibleDuration(moveCount, MAX_RUN_DURATION_MS + 1)).toBe(false);
  });
});