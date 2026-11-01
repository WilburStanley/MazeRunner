"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import { useCanvasPixelSize } from "@/hooks/useCanvasPixelSize";
import { vectorToDirection } from "@/lib/maze/controls";
import { getNeighbor, type Direction, type Maze, type Position } from "@/lib/maze/grid";
import { computeGeometry } from "@/lib/render/geometry";
import {
  createWallsLayer,
  drawExit,
  drawPlayer,
  drawStartMark,
  drawTrail,
} from "@/lib/render/maze-draw";
import { readMazeTheme } from "@/lib/render/theme";

const GLIDE_RATE_PER_SECOND = 30; // how fast the character catches up with its cell
const SNAP_DISTANCE = 0.001;
const MAX_GLIDE_CELLS = 2; // farther than this (a restart, say) jumps instead of gliding
const MAX_FRAME_MS = 64; // after a hidden tab, don't integrate one huge step

const CHOMP_DURATION_MS = 240;
const CHOMP_PERIOD_MS = 70;

const BUMP_DURATION_MS = 110;
const BUMP_DISTANCE_RATIO = 0.14;

const PULSE_PERIOD_MS = 360;

const JOYSTICK_DEAD_ZONE_PX = 18;
const JOYSTICK_MAX_RADIUS_PX = 48;

const ORIGIN_CELL: Position = { row: 0, column: 0 };

// Written by the run logic, read by the frame loop; no re-render needed
export type BoardFeedback = { bumpDirection: Direction | null; bumpAt: number };

type MazeCanvasProps = {
  maze: Maze;
  position: Position;
  facing: Direction;
  trail: readonly Position[];
  reachedEnd: boolean;
  isRunning: boolean;
  feedbackRef: RefObject<BoardFeedback>;
  label: string;
  onTouchDirection: (direction: Direction | null) => void;
};

const follow = (current: number, target: number, factor: number): number => {
  const distance = Math.abs(target - current);
  if (distance < SNAP_DISTANCE || distance > MAX_GLIDE_CELLS) return target;
  return current + (target - current) * factor;
};

const MazeCanvas = ({
  maze,
  position,
  facing,
  trail,
  reachedEnd,
  isRunning,
  feedbackRef,
  label,
  onTouchDirection,
}: MazeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestRef = useRef({ position, facing, trail, reachedEnd, isRunning });
  const renderCellRef = useRef({ row: position.row, column: position.column });
  const movedAtRef = useRef(0);
  const needsDrawRef = useRef(true);
  const joystickOriginRef = useRef<{ originX: number; originY: number } | null>(null);
  const joystickDirectionRef = useRef<Direction | null>(null);
  const pixelSize = useCanvasPixelSize(containerRef);

  useEffect(() => {
    latestRef.current = { position, facing, trail, reachedEnd, isRunning };
    needsDrawRef.current = true;
  }, [position, facing, trail, reachedEnd, isRunning]);

  useEffect(() => {
    movedAtRef.current = performance.now();
  }, [position]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || pixelSize === 0) return;
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const context = canvas.getContext("2d");
    if (context === null) return;

    const theme = readMazeTheme(canvas);
    const geometry = computeGeometry(pixelSize, maze.size);
    const wallsLayer = createWallsLayer(maze, geometry, theme.wall, pixelSize);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    needsDrawRef.current = true;
    let frameId = 0;
    let previousTime = performance.now();

    const drawFrame = (now: number) => {
      frameId = requestAnimationFrame(drawFrame);

      const elapsedMs = Math.min(now - previousTime, MAX_FRAME_MS);
      previousTime = now;
      const latest = latestRef.current;
      const renderCell = renderCellRef.current;

      const glideFactor = reducedMotion
        ? 1
        : 1 - Math.exp((-GLIDE_RATE_PER_SECOND * elapsedMs) / 1000);
      renderCell.row = follow(renderCell.row, latest.position.row, glideFactor);
      renderCell.column = follow(renderCell.column, latest.position.column, glideFactor);
      const isSettled =
        renderCell.row === latest.position.row && renderCell.column === latest.position.column;

      const msSinceMove = now - movedAtRef.current;
      const isChomping = !reducedMotion && msSinceMove >= 0 && msSinceMove < CHOMP_DURATION_MS;

      const { bumpDirection, bumpAt } = feedbackRef.current;
      const bumpProgress = (now - bumpAt) / BUMP_DURATION_MS;
      const isBumping =
        !reducedMotion && bumpDirection !== null && bumpProgress >= 0 && bumpProgress < 1;

      const isPulsing = !reducedMotion && latest.isRunning && !latest.reachedEnd;

      // Idle screens (ready, finished) cost nothing: only repaint when something moves
      if (!needsDrawRef.current && isSettled && !isChomping && !isBumping && !isPulsing) return;
      needsDrawRef.current = false;

      let nudgeX = 0;
      let nudgeY = 0;
      if (isBumping && bumpDirection !== null) {
        const push = Math.sin(bumpProgress * Math.PI) * geometry.cell * BUMP_DISTANCE_RATIO;
        const offset = getNeighbor(ORIGIN_CELL, bumpDirection);
        nudgeX = offset.column * push;
        nudgeY = offset.row * push;
      }

      context.clearRect(0, 0, pixelSize, pixelSize);
      drawTrail(context, geometry, latest.trail, theme.signal);
      context.drawImage(wallsLayer, 0, 0);
      drawStartMark(context, geometry, theme.muted);
      drawExit(context, maze, geometry, theme, {
        pulse: isPulsing ? (Math.sin(now / PULSE_PERIOD_MS) + 1) / 2 : 0,
        reached: latest.reachedEnd,
      });
      drawPlayer(context, geometry, theme.signal, {
        row: renderCell.row,
        column: renderCell.column,
        facing: latest.facing,
        chomp: isChomping ? Math.abs(Math.sin(msSinceMove / CHOMP_PERIOD_MS)) : 0,
        nudgeX,
        nudgeY,
      });
    };

    frameId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(frameId);
  }, [maze, pixelSize, feedbackRef]);

  // Touch: drag anywhere on the maze like a joystick; the origin follows the finger
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    joystickOriginRef.current = { originX: event.clientX, originY: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = joystickOriginRef.current;
    if (origin === null) return;

    const deltaX = event.clientX - origin.originX;
    const deltaY = event.clientY - origin.originY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > JOYSTICK_MAX_RADIUS_PX) {
      const overshootRatio = (distance - JOYSTICK_MAX_RADIUS_PX) / distance;
      origin.originX += deltaX * overshootRatio;
      origin.originY += deltaY * overshootRatio;
    }

    const direction = vectorToDirection(deltaX, deltaY, JOYSTICK_DEAD_ZONE_PX);
    if (direction === joystickDirectionRef.current) return;
    joystickDirectionRef.current = direction;
    onTouchDirection(direction);
  };

  const handlePointerEnd = () => {
    joystickOriginRef.current = null;
    if (joystickDirectionRef.current === null) return;
    joystickDirectionRef.current = null;
    onTouchDirection(null);
  };

  return (
    <div
      ref={containerRef}
      className="maze-frame"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="maze-canvas" role="img" aria-label={label} />
    </div>
  );
};

export default MazeCanvas;