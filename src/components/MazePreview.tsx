"use client";

import { useEffect, useRef } from "react";
import { useCanvasPixelSize } from "@/hooks/useCanvasPixelSize";
import type { Maze } from "@/lib/maze/grid";
import { computeGeometry } from "@/lib/render/geometry";
import { drawExit, drawStartMark, drawWalls } from "@/lib/render/maze-draw";
import { readMazeTheme } from "@/lib/render/theme";

type MazePreviewProps = { maze: Maze; label: string };

// A static drawing of a real maze (walls, start, exit) for the menu
const MazePreview = ({ maze, label }: MazePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelSize = useCanvasPixelSize(containerRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || pixelSize === 0) return;
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const context = canvas.getContext("2d");
    if (context === null) return;

    const theme = readMazeTheme(canvas);
    const geometry = computeGeometry(pixelSize, maze.size);
    drawWalls(context, maze, geometry, theme.wall);
    drawStartMark(context, geometry, theme.muted);
    drawExit(context, maze, geometry, theme, { pulse: 0, reached: false });
  }, [maze, pixelSize]);

  return (
    <div ref={containerRef} className="maze-frame">
      <canvas ref={canvasRef} className="maze-canvas" role="img" aria-label={label} />
    </div>
  );
};

export default MazePreview;