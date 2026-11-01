"use client";

import { useState } from "react";
import type { PointerEvent } from "react";
import type { Direction } from "@/lib/maze/grid";

type DirectionPadProps = {
  onPress: (direction: Direction) => void;
  onRelease: (direction: Direction) => void;
};

type PadKey = {
  direction: Direction;
  label: string;
  rotation: number;
  column: number;
  row: number;
};

// Laid out like the W / A S D keys, so the pad takes two rows instead of three
const PAD_KEYS: readonly PadKey[] = [
  { direction: "north", label: "Move up", rotation: 0, column: 2, row: 1 },
  { direction: "west", label: "Move left", rotation: 270, column: 1, row: 2 },
  { direction: "south", label: "Move down", rotation: 180, column: 2, row: 2 },
  { direction: "east", label: "Move right", rotation: 90, column: 3, row: 2 },
];

const DirectionPad = ({ onPress, onRelease }: DirectionPadProps) => {
  const [pressedDirection, setPressedDirection] = useState<Direction | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, direction: Direction) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId); // a sliding finger still ends cleanly
    setPressedDirection(direction);
    onPress(direction);
  };

  const handlePointerEnd = (direction: Direction) => {
    setPressedDirection((current) => (current === direction ? null : current));
    onRelease(direction);
  };

  return (
    <div
      className="pad"
      role="group"
      aria-label="Direction pad"
      onContextMenu={(event) => event.preventDefault()}
    >
      {PAD_KEYS.map(({ direction, label, rotation, column, row }) => (
        <button
          key={direction}
          type="button"
          className="pad-key"
          aria-label={label}
          data-pressed={pressedDirection === direction}
          style={{ gridColumn: column, gridRow: row }}
          onPointerDown={(event) => handlePointerDown(event, direction)}
          onPointerUp={() => handlePointerEnd(direction)}
          onPointerCancel={() => handlePointerEnd(direction)}
          onClick={(event) => {
            // detail 0 = keyboard activation (Enter or Space): a single step
            if (event.detail !== 0) return;
            onPress(direction);
            onRelease(direction);
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <path
              d="M5 15 L12 8 L19 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default DirectionPad;