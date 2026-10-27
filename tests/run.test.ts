import { describe, it, expect } from "vitest";
import { generateMaze } from "../src/lib/maze/generate";
import { encodeId } from "../src/lib/maze/id";
import { MAX_RUN_DURATION_MS, MIN_MS_PER_MOVE } from "../src/lib/maze/replay";
import { finishRun, startRun, type FinishRunInput } from "../src/lib/run";
import { signToken, verifyToken } from "../src/lib/tokens";
import { solveToMoves } from "./helpers";

const TEST_SECRET = "run-test-secret-not-real";
const OTHER_SECRET = "another-run-test-secret";
const MAZE_SPEC = { algorithm: "K" as const, size: 21, seed: 12345 };
const MAZE_ID = encodeId(MAZE_SPEC);
const START_TIME_MS = 1_700_000_000_000;

const solutionMoves = solveToMoves(generateMaze(MAZE_SPEC));
const FASTEST_ALLOWED_MS = solutionMoves.length * MIN_MS_PER_MOVE;
const REALISTIC_ELAPSED_MS = FASTEST_ALLOWED_MS * 4;

const createRunToken = (): string => {
  const result = startRun(MAZE_ID, START_TIME_MS, TEST_SECRET);
  if (!result.ok) throw new Error("test setup: startRun failed");
  return result.runToken;
};

const buildFinishInput = (overrides: Partial<FinishRunInput> = {}): FinishRunInput => ({
  runToken: createRunToken(),
  moves: solutionMoves,
  nickname: "Ana",
  ...overrides,
});

describe("startRun", () => {
  it("signs a run token for the canonical maze id", () => {
    const result = startRun(MAZE_ID.toLowerCase(), START_TIME_MS, TEST_SECRET);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mazeId).toBe(MAZE_ID);
    expect(verifyToken(result.runToken, TEST_SECRET, "run")).toEqual({
      kind: "run",
      mazeId: MAZE_ID,
      startedAtMs: START_TIME_MS,
    });
  });

  it("rejects invalid maze ids", () => {
    for (const invalid of ["", "nope", "M1-K-21-7QX4D2-G", 42, null, undefined]) {
      expect(startRun(invalid, START_TIME_MS, TEST_SECRET)).toEqual({
        ok: false,
        error: "invalid-maze-id",
      });
    }
  });
});

describe("finishRun", () => {
  it("accepts a valid solution and signs a result", () => {
    const result = finishRun(buildFinishInput(), START_TIME_MS + REALISTIC_ELAPSED_MS, TEST_SECRET);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({
      mazeId: MAZE_ID,
      elapsedMs: REALISTIC_ELAPSED_MS,
      moveCount: solutionMoves.length,
      nickname: "Ana",
    });
    expect(verifyToken(result.resultToken, TEST_SECRET, "result")).toEqual({
      kind: "result",
      mazeId: MAZE_ID,
      elapsedMs: REALISTIC_ELAPSED_MS,
      moveCount: solutionMoves.length,
      nickname: "Ana",
    });
  });

  it("treats a missing nickname as none", () => {
    const result = finishRun(
      buildFinishInput({ nickname: undefined }),
      START_TIME_MS + REALISTIC_ELAPSED_MS,
      TEST_SECRET,
    );
    expect(result.ok && result.nickname).toBeNull();
  });

  it("rejects missing, forged, wrong-secret and wrong-kind tokens", () => {
    const resultKindToken = signToken(
      { kind: "result", mazeId: MAZE_ID, elapsedMs: 1, moveCount: 1, nickname: null },
      TEST_SECRET,
    );
    const wrongSecretToken = signToken(
      { kind: "run", mazeId: MAZE_ID, startedAtMs: START_TIME_MS },
      OTHER_SECRET,
    );
    for (const badToken of ["", "garbage", wrongSecretToken, resultKindToken, 42, undefined]) {
      const result = finishRun(
        buildFinishInput({ runToken: badToken }),
        START_TIME_MS + REALISTIC_ELAPSED_MS,
        TEST_SECRET,
      );
      expect(result).toEqual({ ok: false, error: "invalid-token" });
    }
  });

  it("rejects impossibly fast runs but accepts the fastest allowed one", () => {
    const tooFast = finishRun(buildFinishInput(), START_TIME_MS + FASTEST_ALLOWED_MS - 1, TEST_SECRET);
    expect(tooFast).toEqual({ ok: false, error: "implausible-time" });

    const justFastEnough = finishRun(buildFinishInput(), START_TIME_MS + FASTEST_ALLOWED_MS, TEST_SECRET);
    expect(justFastEnough.ok).toBe(true);
  });

  it("rejects expired runs and clocks that run backwards", () => {
    const expired = finishRun(buildFinishInput(), START_TIME_MS + MAX_RUN_DURATION_MS + 1, TEST_SECRET);
    expect(expired).toEqual({ ok: false, error: "implausible-time" });

    const beforeStart = finishRun(buildFinishInput(), START_TIME_MS - 1000, TEST_SECRET);
    expect(beforeStart).toEqual({ ok: false, error: "implausible-time" });
  });

  it("rejects incomplete, malformed and blocked move lists", () => {
    const nowMs = START_TIME_MS + REALISTIC_ELAPSED_MS;
    const incomplete = finishRun(buildFinishInput({ moves: solutionMoves.slice(0, -1) }), nowMs, TEST_SECRET);
    expect(incomplete).toEqual({ ok: false, error: "did-not-reach-end" });

    const malformed = finishRun(buildFinishInput({ moves: "north" }), nowMs, TEST_SECRET);
    expect(malformed).toEqual({ ok: false, error: "invalid-moves" });
  });

  it("rejects an invalid nickname", () => {
    const result = finishRun(
      buildFinishInput({ nickname: "<script>" }),
      START_TIME_MS + REALISTIC_ELAPSED_MS,
      TEST_SECRET,
    );
    expect(result).toEqual({ ok: false, error: "invalid-nickname" });
  });

  it("does not accept the solution of a different maze", () => {
    const otherMazeToken = startRun(
      encodeId({ algorithm: "K", size: 21, seed: 54321 }),
      START_TIME_MS,
      TEST_SECRET,
    );
    if (!otherMazeToken.ok) throw new Error("test setup: startRun failed");

    const result = finishRun(
      buildFinishInput({ runToken: otherMazeToken.runToken }),
      START_TIME_MS + REALISTIC_ELAPSED_MS,
      TEST_SECRET,
    );
    expect(result.ok).toBe(false);
  });
});