import { describe, it, expect } from "vitest";
import { generateMaze } from "../src/lib/maze/generate";
import { DIRECTIONS, getStartPosition } from "../src/lib/maze/grid";
import { replayMoves } from "../src/lib/maze/replay";
import { applyStep, createInitialRunState, hasReachedEnd } from "../src/lib/maze/run-state";
import { solveToMoves } from "./helpers";

const maze = generateMaze({ algorithm: "K", size: 21, seed: 12345 });
const startPosition = getStartPosition();
const startCell = maze.cells[startPosition.row][startPosition.column];
const openDirection = DIRECTIONS.find((direction) => !startCell[direction])!;
const wallDirection = DIRECTIONS.find((direction) => startCell[direction])!;

describe("run state", () => {
  it("starts at the start cell with no moves", () => {
    const state = createInitialRunState();
    expect(state.position).toEqual(startPosition);
    expect(state.moves).toEqual([]);
    expect(state.trail).toEqual([startPosition]);
    expect(hasReachedEnd(maze, state)).toBe(false);
  });

  it("moves through an open passage and records it", () => {
    const state = applyStep(maze, createInitialRunState(), openDirection);
    expect(state.moves).toEqual([openDirection]);
    expect(state.facing).toBe(openDirection);
    expect(state.trail).toHaveLength(2);
    expect(state.position).not.toEqual(startPosition);
  });

  it("does not record a move into a wall, but turns to face it", () => {
    const initial = createInitialRunState();
    const bumped = applyStep(maze, initial, wallDirection);
    expect(bumped.moves).toEqual([]);
    expect(bumped.position).toEqual(startPosition);
    expect(bumped.facing).toBe(wallDirection);
  });

  it("returns the same object when nothing changes", () => {
    const bumpedOnce = applyStep(maze, createInitialRunState(), wallDirection);
    expect(applyStep(maze, bumpedOnce, wallDirection)).toBe(bumpedOnce);
  });

  it("never mutates the previous state", () => {
    const initial = createInitialRunState();
    applyStep(maze, initial, openDirection);
    expect(initial.moves).toEqual([]);
    expect(initial.trail).toHaveLength(1);
  });

  it("reaches the end by following the solution, and the server would accept it", () => {
    const finalState = solveToMoves(maze).reduce(
      (state, direction) => applyStep(maze, state, direction),
      createInitialRunState(),
    );
    expect(hasReachedEnd(maze, finalState)).toBe(true);
    expect(replayMoves(maze, finalState.moves).ok).toBe(true);
  });
});