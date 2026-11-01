import {
  getEndPosition,
  getNeighbor,
  getStartPosition,
  type Direction,
  type Maze,
  type Position,
} from "./grid";

export type RunState = {
  position: Position;
  facing: Direction;
  moves: Direction[];
  trail: Position[];
};

const INITIAL_FACING: Direction = "east";

export const createInitialRunState = (): RunState => {
  const start = getStartPosition();
  return { position: start, facing: INITIAL_FACING, moves: [], trail: [start] };
};

// Pure: returns the SAME object when nothing changed, so callers can detect "no-op"
export const applyStep = (maze: Maze, state: RunState, direction: Direction): RunState => {
  const { row, column } = state.position;
  if (maze.cells[row][column][direction]) {
    return state.facing === direction ? state : { ...state, facing: direction };
  }
  const nextPosition = getNeighbor(state.position, direction);
  return {
    position: nextPosition,
    facing: direction,
    moves: [...state.moves, direction],
    trail: [...state.trail, nextPosition],
  };
};

export const hasReachedEnd = (maze: Maze, state: RunState): boolean => {
  const end = getEndPosition(maze);
  return state.position.row === end.row && state.position.column === end.column;
};