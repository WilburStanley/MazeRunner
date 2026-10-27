import {
  DIRECTIONS,
  getNeighbor,
  type Direction,
  type Maze,
  type Position,
} from "../src/lib/maze/grid";
import { findShortestPath } from "../src/lib/maze/solve";

export const pathToMoves = (path: Position[]): Direction[] =>
  path.slice(1).map((position, index) => {
    const previous = path[index];
    const direction = DIRECTIONS.find((candidate) => {
      const neighbor = getNeighbor(previous, candidate);
      return neighbor.row === position.row && neighbor.column === position.column;
    });
    if (direction === undefined) throw new Error("path steps are not adjacent");
    return direction;
  });

export const solveToMoves = (maze: Maze): Direction[] => {
  const path = findShortestPath(maze);
  if (path === null) throw new Error("maze has no solution");
  return pathToMoves(path);
};