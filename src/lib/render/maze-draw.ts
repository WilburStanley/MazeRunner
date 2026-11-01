import {
  getEndPosition,
  getStartPosition,
  type Direction,
  type Maze,
  type Position,
} from "@/lib/maze/grid";
import type { BoardGeometry } from "./geometry";
import type { MazeTheme } from "./theme";

const FULL_TURN = Math.PI * 2;

const TRAIL_ALPHA = 0.3;
const TRAIL_WIDTH_RATIO = 0.16;
const START_MARK_RATIO = 0.09;
const EXIT_RING_RATIO = 0.34;
const EXIT_DOT_RATIO = 0.12;
const EXIT_RING_WIDTH_RATIO = 0.08;
const EXIT_PULSE_GROWTH = 0.1;
const PLAYER_RADIUS_RATIO = 0.34;
const MOUTH_REST_HALF_ANGLE = 0.12; // in half turns (multiples of PI)
const MOUTH_CHOMP_RANGE = 0.18;

const FACING_ANGLES: Record<Direction, number> = {
  east: 0,
  south: Math.PI / 2,
  west: Math.PI,
  north: -Math.PI / 2,
};

export const cellCenter = (geometry: BoardGeometry, index: number): number =>
  geometry.origin + (index + 0.5) * geometry.cell;

// Each shared wall is stroked once. Odd line widths are shifted half a pixel
// so they cover whole pixels instead of blurring across two.
export const drawWalls = (
  context: CanvasRenderingContext2D,
  maze: Maze,
  geometry: BoardGeometry,
  color: string,
): void => {
  const { origin, cell, wallWidth } = geometry;
  const pixelOffset = (wallWidth % 2) / 2;
  const toCoordinate = (index: number): number => origin + index * cell + pixelOffset;

  context.save();
  context.strokeStyle = color;
  context.lineWidth = wallWidth;
  context.lineCap = "square";
  context.beginPath();
  maze.cells.forEach((rowCells, row) => {
    rowCells.forEach((walls, column) => {
      const left = toCoordinate(column);
      const right = toCoordinate(column + 1);
      const top = toCoordinate(row);
      const bottom = toCoordinate(row + 1);
      if (row === 0 && walls.north) {
        context.moveTo(left, top);
        context.lineTo(right, top);
      }
      if (column === 0 && walls.west) {
        context.moveTo(left, top);
        context.lineTo(left, bottom);
      }
      if (walls.south) {
        context.moveTo(left, bottom);
        context.lineTo(right, bottom);
      }
      if (walls.east) {
        context.moveTo(right, top);
        context.lineTo(right, bottom);
      }
    });
  });
  context.stroke();
  context.restore();
};

// Walls never change during a run, so they are drawn once into their own layer
export const createWallsLayer = (
  maze: Maze,
  geometry: BoardGeometry,
  color: string,
  pixelSize: number,
): HTMLCanvasElement => {
  const layer = document.createElement("canvas");
  layer.width = pixelSize;
  layer.height = pixelSize;
  const layerContext = layer.getContext("2d");
  if (layerContext !== null) drawWalls(layerContext, maze, geometry, color);
  return layer;
};

export const drawStartMark = (
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  color: string,
): void => {
  const start = getStartPosition();
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.arc(
    cellCenter(geometry, start.column),
    cellCenter(geometry, start.row),
    Math.max(2, geometry.cell * START_MARK_RATIO),
    0,
    FULL_TURN,
  );
  context.fill();
  context.restore();
};

export type ExitOptions = {
  pulse: number; // 0..1, always 0 when motion is reduced
  reached: boolean;
};

// The goal is a ring with a dot: unmistakable, and unlike anything else on the board
export const drawExit = (
  context: CanvasRenderingContext2D,
  maze: Maze,
  geometry: BoardGeometry,
  theme: MazeTheme,
  { pulse, reached }: ExitOptions,
): void => {
  const end = getEndPosition(maze);
  const centerX = cellCenter(geometry, end.column);
  const centerY = cellCenter(geometry, end.row);
  const color = reached ? theme.signal : theme.exit;

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(1, Math.round(geometry.cell * EXIT_RING_WIDTH_RATIO));
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    geometry.cell * EXIT_RING_RATIO * (1 + EXIT_PULSE_GROWTH * pulse),
    0,
    FULL_TURN,
  );
  context.stroke();
  context.beginPath();
  context.arc(centerX, centerY, geometry.cell * EXIT_DOT_RATIO, 0, FULL_TURN);
  context.fill();
  context.restore();
};

export const drawTrail = (
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  trail: readonly Position[],
  color: string,
): void => {
  if (trail.length < 2) return;
  context.save();
  context.globalAlpha = TRAIL_ALPHA;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, Math.round(geometry.cell * TRAIL_WIDTH_RATIO));
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  trail.forEach((position, index) => {
    const centerX = cellCenter(geometry, position.column);
    const centerY = cellCenter(geometry, position.row);
    if (index === 0) context.moveTo(centerX, centerY);
    else context.lineTo(centerX, centerY);
  });
  context.stroke();
  context.restore();
};

export type PlayerSprite = {
  row: number; // fractional while gliding between cells
  column: number;
  facing: Direction;
  chomp: number; // 0 = resting mouth, 1 = fully open
  nudgeX: number; // pixels, used for the wall-bump feedback
  nudgeY: number;
};

export const drawPlayer = (
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  color: string,
  sprite: PlayerSprite,
): void => {
  const centerX = cellCenter(geometry, sprite.column) + sprite.nudgeX;
  const centerY = cellCenter(geometry, sprite.row) + sprite.nudgeY;
  const mouthHalfAngle = (MOUTH_REST_HALF_ANGLE + MOUTH_CHOMP_RANGE * sprite.chomp) * Math.PI;
  const facingAngle = FACING_ANGLES[sprite.facing];

  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.arc(
    centerX,
    centerY,
    geometry.cell * PLAYER_RADIUS_RATIO,
    facingAngle + mouthHalfAngle,
    facingAngle + FULL_TURN - mouthHalfAngle,
  );
  context.closePath();
  context.fill();
  context.restore();
};