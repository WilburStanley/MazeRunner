import {
  DIRECTIONS,
  getEndPosition,
  getNeighbor,
  getStartPosition,
  isInsideMaze,
  type Maze,
  type Position,
} from "./grid";

export const findShortestPath = (maze: Maze): Position[] | null => {
  const start = getStartPosition();
  const end = getEndPosition(maze);
  const toKey = (position: Position): number => position.row * maze.size + position.column;

  const previousByKey = new Map<number, Position | null>([[toKey(start), null]]);
  const queue: Position[] = [start];
  let queueHead = 0;

  while (queueHead < queue.length) {
    const current = queue[queueHead++];

    if (current.row === end.row && current.column === end.column) {
      const path: Position[] = [];
      let step: Position | null = current;
      while (step !== null) {
        path.push(step);
        step = previousByKey.get(toKey(step)) ?? null;
      }
      return path.reverse();
    }

    for (const direction of DIRECTIONS) {
      if (maze.cells[current.row][current.column][direction]) continue;
      const neighbor = getNeighbor(current, direction);
      if (!isInsideMaze(maze, neighbor) || previousByKey.has(toKey(neighbor))) continue;
      previousByKey.set(toKey(neighbor), current);
      queue.push(neighbor);
    }
  }
  return null;
};