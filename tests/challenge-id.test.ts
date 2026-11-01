import { describe, expect, it } from "vitest";
import { encodeChallengeId, parseChallengeId } from "../src/lib/challenge-id";
import { encodeId, type MazeSpec } from "../src/lib/maze/id";

const SECRET = "test-secret";
const SPEC: MazeSpec = { algorithm: "K", size: 21, seed: 7 };
const MAZE_ID = encodeId(SPEC);

const buildId = (elapsedMs = 41_237, nickname: string | null = "Ana") =>
  encodeChallengeId({ spec: SPEC, elapsedMs, nickname }, SECRET);

describe("challenge IDs", () => {
  it("round-trips the maze, time and nickname", () => {
    expect(parseChallengeId(buildId(), SECRET)).toEqual({
      mazeId: MAZE_ID,
      elapsedMs: 41_237,
      nickname: "Ana",
    });
  });

  it("round-trips a missing nickname and a zero time", () => {
    expect(parseChallengeId(buildId(0, null), SECRET)).toEqual({
      mazeId: MAZE_ID,
      elapsedMs: 0,
      nickname: null,
    });
  });

  it("keeps case, spaces and punctuation in nicknames", () => {
    for (const nickname of ["aNa b", "x_y.z-1", "A".repeat(20)]) {
      expect(parseChallengeId(buildId(5000, nickname), SECRET)?.nickname).toBe(nickname);
    }
  });

  it("is case-insensitive and ignores surrounding spaces when read back", () => {
    expect(parseChallengeId(`  ${buildId().toLowerCase()} `, SECRET)?.elapsedMs).toBe(41_237);
  });

  it("starts with the version and has seven parts", () => {
    const parts = buildId().split("-");
    expect(parts[0]).toBe("C1");
    expect(parts).toHaveLength(7);
  });

  it("is the same every time for the same input", () => {
    expect(buildId()).toBe(buildId());
  });

  it("rejects an edited time", () => {
    const parts = buildId(41_237).split("-");
    parts[4] = "1"; // a claimed 1 ms
    expect(parseChallengeId(parts.join("-"), SECRET)).toBeNull();
  });

  it("rejects an edited name, maze or signature", () => {
    const original = buildId().split("-");
    const edits: [number, string][] = [
      [1, "B"],
      [2, "31"],
      [3, "000000"],
      [5, "0"],
      [6, "AAAAAAAAAA"],
    ];
    for (const [position, replacement] of edits) {
      const parts = [...original];
      parts[position] = replacement;
      expect(parseChallengeId(parts.join("-"), SECRET)).toBeNull();
    }
  });

  it("rejects an ID signed with another secret", () => {
    expect(parseChallengeId(buildId(), "another-secret")).toBeNull();
  });

  it("rejects malformed input", () => {
    const valid = buildId();
    for (const bad of ["", "nope", "C1", `${valid}-X`, valid.replace("C1", "C2"), MAZE_ID]) {
      expect(parseChallengeId(bad, SECRET)).toBeNull();
    }
  });
});