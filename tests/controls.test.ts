import { describe, it, expect } from "vitest";
import { keyToDirection, vectorToDirection } from "../src/lib/maze/controls";

describe("keyToDirection", () => {
  it("maps WASD in either case", () => {
    expect(keyToDirection("w")).toBe("north");
    expect(keyToDirection("A")).toBe("west");
    expect(keyToDirection("s")).toBe("south");
    expect(keyToDirection("D")).toBe("east");
  });

  it("maps the arrow keys", () => {
    expect(keyToDirection("ArrowUp")).toBe("north");
    expect(keyToDirection("ArrowLeft")).toBe("west");
    expect(keyToDirection("ArrowDown")).toBe("south");
    expect(keyToDirection("ArrowRight")).toBe("east");
  });

  it("ignores other keys, including object prototype names", () => {
    for (const key of ["x", " ", "Enter", "constructor", "toString"]) {
      expect(keyToDirection(key)).toBeNull();
    }
  });
});

describe("vectorToDirection", () => {
  const deadZone = 18;

  it("returns null inside the dead zone", () => {
    expect(vectorToDirection(0, 0, deadZone)).toBeNull();
    expect(vectorToDirection(10, -10, deadZone)).toBeNull();
  });

  it("picks the dominant axis", () => {
    expect(vectorToDirection(30, 5, deadZone)).toBe("east");
    expect(vectorToDirection(-30, 5, deadZone)).toBe("west");
    expect(vectorToDirection(5, 30, deadZone)).toBe("south");
    expect(vectorToDirection(5, -30, deadZone)).toBe("north");
  });

  it("gives ties to the horizontal axis", () => {
    expect(vectorToDirection(25, 25, deadZone)).toBe("east");
    expect(vectorToDirection(-25, -25, deadZone)).toBe("west");
  });
});