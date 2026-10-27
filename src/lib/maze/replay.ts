import {
  DIRECTIONS,
  getEndPosition,
  getNeighbor,
  getStartPosition,
  type Direction,
  type Maze,
} from "./grid";

export const MAX_MOVES = 20000;
export const MIN_MS_PER_MOVE = 50; // faster than key auto-repeat, so a human can't beat it
export const MAX_RUN_DURATION_MS = 2 * 60 * 60 * 1000; // stale tokens are rejected

export type ReplayFailure = "invalid-moves" | "blocked-by-wall" | "did-not-reach-end";
export type ReplayResult =
  | { ok: true; moveCount: number }
  | { ok: false; reason: ReplayFailure };

const isDirection = (value: unknown): value is Direction =>
  typeof value === "string" && (DIRECTIONS as readonly string[]).includes(value);

const isMoveList = (value: unknown): value is Direction[] =>
  Array.isArray(value) && value.length <= MAX_MOVES && value.every(isDirection);

// The client only reports moves; the server decides whether they solve the maze
export const replayMoves = (maze: Maze, moves: unknown): ReplayResult => {
  if (!isMoveList(moves)) return { ok: false, reason: "invalid-moves" };

  let position = getStartPosition();
  for (const move of moves) {
    if (maze.cells[position.row][position.column][move]) {
      return { ok: false, reason: "blocked-by-wall" };
    }
    position = getNeighbor(position, move);
  }

  const end = getEndPosition(maze);
  if (position.row !== end.row || position.column !== end.column) {
    return { ok: false, reason: "did-not-reach-end" };
  }
  return { ok: true, moveCount: moves.length };
};

export const isPlausibleDuration = (moveCount: number, elapsedMs: number): boolean =>
  elapsedMs >= moveCount * MIN_MS_PER_MOVE && elapsedMs <= MAX_RUN_DURATION_MS;