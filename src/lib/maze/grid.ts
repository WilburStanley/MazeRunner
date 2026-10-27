export type Direction = "north" | "east" | "south" | "west";
export type Position = { row: number; column: number };
export type CellWalls = Record<Direction, boolean>; // true = wall present
export type Maze = { size: number; cells: CellWalls[][] }; // cells[row][column]

export const DIRECTIONS: readonly Direction[] = ["north", "east", "south", "west"];

const DIRECTION_OFFSETS: Record<Direction, Position> = {
  north: { row: -1, column: 0 },
  east: { row: 0, column: 1 },
  south: { row: 1, column: 0 },
  west: { row: 0, column: -1 },
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: "south",
  east: "west",
  south: "north",
  west: "east",
};

export const createWalledMaze = (size: number): Maze => ({
  size,
  cells: Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ north: true, east: true, south: true, west: true })),
  ),
});

export const isInsideMaze = (maze: Maze, position: Position): boolean =>
  position.row >= 0 &&
  position.row < maze.size &&
  position.column >= 0 &&
  position.column < maze.size;

export const getNeighbor = (position: Position, direction: Direction): Position => {
  const offset = DIRECTION_OFFSETS[direction];
  return { row: position.row + offset.row, column: position.column + offset.column };
};

// Removes the wall on both sides so the two cells stay consistent
export const carvePassage = (maze: Maze, position: Position, direction: Direction): void => {
  const neighbor = getNeighbor(position, direction);
  maze.cells[position.row][position.column][direction] = false;
  maze.cells[neighbor.row][neighbor.column][OPPOSITE_DIRECTION[direction]] = false;
};

export const getStartPosition = (): Position => ({ row: 0, column: 0 });

export const getEndPosition = (maze: Maze): Position => ({
  row: maze.size - 1,
  column: maze.size - 1,
});