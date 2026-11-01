import { describe, it, expect } from "vitest";
import {
  pressKey,
  releaseKey,
  resolveActiveDirection,
  type KeyStack,
} from "../src/lib/maze/held-directions";

describe("held direction keys", () => {
  it("lets the newest press win and falls back to the key still held", () => {
    let stack: KeyStack = [];
    stack = pressKey(stack, "north");
    stack = pressKey(stack, "east");
    expect(resolveActiveDirection(stack, null)).toBe("east");

    stack = releaseKey(stack, "east");
    expect(resolveActiveDirection(stack, null)).toBe("north");

    stack = releaseKey(stack, "north");
    expect(resolveActiveDirection(stack, null)).toBeNull();
  });

  it("moves a re-pressed key to the top without duplicating it", () => {
    let stack: KeyStack = [];
    stack = pressKey(stack, "north");
    stack = pressKey(stack, "east");
    stack = pressKey(stack, "north");
    expect(stack).toEqual(["east", "north"]);
  });

  it("ignores the release of a key that is not held", () => {
    const stack = pressKey([], "south");
    expect(releaseKey(stack, "west")).toEqual(["south"]);
  });

  it("lets an active touch direction override the keyboard", () => {
    const stack = pressKey([], "north");
    expect(resolveActiveDirection(stack, "west")).toBe("west");
    expect(resolveActiveDirection(stack, null)).toBe("north");
  });

  it("never mutates the previous stack", () => {
    const original: KeyStack = ["north"];
    pressKey(original, "east");
    releaseKey(original, "north");
    expect(original).toEqual(["north"]);
  });
});