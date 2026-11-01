"use client";

import { useCallback, useEffect, useRef } from "react";
import { isTypingTarget } from "@/lib/dom";
import { keyToDirection } from "@/lib/maze/controls";
import type { Direction } from "@/lib/maze/grid";
import {
  pressKey,
  releaseKey,
  resolveActiveDirection,
  type KeyStack,
} from "@/lib/maze/held-directions";

// Our own repeat rate. Browsers auto-repeat held keys every ~30ms, which is too fast to pace.
const HOLD_REPEAT_INTERVAL_MS = 80;

type UseHeldDirectionOptions = {
  enabled: boolean;
  onStep: (direction: Direction) => void;
};

export const useHeldDirection = ({ enabled, onStep }: UseHeldDirectionOptions) => {
  const keyStackRef = useRef<KeyStack>([]);
  const touchDirectionRef = useRef<Direction | null>(null);
  const enabledRef = useRef(enabled);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    enabledRef.current = enabled;
    onStepRef.current = onStep;
  }, [enabled, onStep]);

  const stepActiveDirection = useCallback(() => {
    if (!enabledRef.current) return;
    const direction = resolveActiveDirection(keyStackRef.current, touchDirectionRef.current);
    if (direction !== null) onStepRef.current(direction);
  }, []);

  const releaseAll = useCallback(() => {
    keyStackRef.current = [];
    touchDirectionRef.current = null;
  }, []);

  // A new touch direction acts at once; holding it keeps repeating on the timer below
  const setTouchDirection = useCallback(
    (direction: Direction | null) => {
      touchDirectionRef.current = direction;
      if (direction !== null) stepActiveDirection();
    },
    [stepActiveDirection],
  );

  const releaseTouchDirection = useCallback((direction: Direction) => {
    if (touchDirectionRef.current === direction) touchDirectionRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      releaseAll();
      return;
    }

    const intervalId = window.setInterval(stepActiveDirection, HOLD_REPEAT_INTERVAL_MS);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      const direction = keyToDirection(event.key);
      if (direction === null) return;
      event.preventDefault(); // stops arrow keys from scrolling the page
      if (event.repeat) return; // the interval above handles repeating
      keyStackRef.current = pressKey(keyStackRef.current, direction);
      stepActiveDirection();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = keyToDirection(event.key);
      if (direction !== null) keyStackRef.current = releaseKey(keyStackRef.current, direction);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, releaseAll, stepActiveDirection]);

  return { setTouchDirection, releaseTouchDirection };
};