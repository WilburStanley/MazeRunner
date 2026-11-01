export type BoardGeometry = {
  origin: number; // pixel offset of the maze's top-left corner
  cell: number; // whole-pixel cell size, so wall lines land on pixel boundaries
  wallWidth: number; // whole-pixel wall thickness
};

const EDGE_PADDING_RATIO = 0.035;
const MIN_EDGE_PADDING_PX = 6;
const WALL_RATIO = 0.1;
const MIN_CELL_PX = 2;

// Integer cell and wall sizes keep the lines crisp on every screen density
export const computeGeometry = (pixelSize: number, mazeSize: number): BoardGeometry => {
  const padding = Math.max(MIN_EDGE_PADDING_PX, Math.round(pixelSize * EDGE_PADDING_RATIO));
  const cell = Math.max(MIN_CELL_PX, Math.floor((pixelSize - padding * 2) / mazeSize));
  const origin = Math.floor((pixelSize - cell * mazeSize) / 2);
  const wallWidth = Math.max(1, Math.round(cell * WALL_RATIO));
  return { origin, cell, wallWidth };
};