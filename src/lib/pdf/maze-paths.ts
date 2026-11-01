import type { Maze, Position } from "@/lib/maze/grid";

// SVG path strings in board-local units: the origin is the maze's top-left corner and y points
// down, which is how pdf-lib's drawSvgPath expects them. Only absolute M and L commands are used.
const formatNumber = (value: number): string => value.toFixed(2);

const segment = (fromX: number, fromY: number, toX: number, toY: number): string =>
  `M ${formatNumber(fromX)} ${formatNumber(fromY)} L ${formatNumber(toX)} ${formatNumber(toY)}`;

// Each shared wall is written once: the outer top and left edges, then every south and east wall
export const buildWallsPath = (maze: Maze, cell: number): string => {
  const segments: string[] = [];
  maze.cells.forEach((rowCells, row) => {
    rowCells.forEach((walls, column) => {
      const left = column * cell;
      const right = (column + 1) * cell;
      const top = row * cell;
      const bottom = (row + 1) * cell;
      if (row === 0 && walls.north) segments.push(segment(left, top, right, top));
      if (column === 0 && walls.west) segments.push(segment(left, top, left, bottom));
      if (walls.south) segments.push(segment(left, bottom, right, bottom));
      if (walls.east) segments.push(segment(right, top, right, bottom));
    });
  });
  return segments.join(" ");
};

// A line through the middle of every cell on the route
export const buildRoutePath = (route: readonly Position[], cell: number): string =>
  route
    .map((position, index) => {
      const command = index === 0 ? "M" : "L";
      const centerX = (position.column + 0.5) * cell;
      const centerY = (position.row + 0.5) * cell;
      return `${command} ${formatNumber(centerX)} ${formatNumber(centerY)}`;
    })
    .join(" ");