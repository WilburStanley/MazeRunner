// All measurements are PDF points (1/72 inch). PDF's y axis points up from the bottom edge.
export const PAGE_WIDTH_POINTS = 595.28; // A4 portrait
export const PAGE_HEIGHT_POINTS = 841.89;
export const PAGE_MARGIN_POINTS = 48;

const WALL_RATIO = 0.09;
const MIN_WALL_POINTS = 0.9;
const MAX_WALL_POINTS = 2.4;

export type SheetLayout = {
  boardLeft: number; // x of the maze's left edge
  boardTop: number; // y of the maze's top edge
  boardSide: number; // the maze is a square
  cell: number;
  wallWidth: number;
};

export type SheetLayoutOptions = {
  mazeSize: number;
  headerHeight: number; // space reserved above the maze
  footerHeight: number; // space reserved below the maze
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

// The largest square that fits between the margins, header and footer, centred horizontally
export const computeSheetLayout = ({
  mazeSize,
  headerHeight,
  footerHeight,
}: SheetLayoutOptions): SheetLayout => {
  const availableWidth = PAGE_WIDTH_POINTS - PAGE_MARGIN_POINTS * 2;
  const availableHeight = PAGE_HEIGHT_POINTS - PAGE_MARGIN_POINTS * 2 - headerHeight - footerHeight;
  const boardSide = Math.min(availableWidth, availableHeight);
  const cell = boardSide / mazeSize;

  return {
    boardLeft: (PAGE_WIDTH_POINTS - boardSide) / 2,
    boardTop: PAGE_HEIGHT_POINTS - PAGE_MARGIN_POINTS - headerHeight,
    boardSide,
    cell,
    wallWidth: clamp(cell * WALL_RATIO, MIN_WALL_POINTS, MAX_WALL_POINTS),
  };
};

// Centre of a cell in page coordinates
export const cellCenterPoint = (
  layout: SheetLayout,
  position: { row: number; column: number },
): { x: number; y: number } => ({
  x: layout.boardLeft + (position.column + 0.5) * layout.cell,
  y: layout.boardTop - (position.row + 0.5) * layout.cell,
});