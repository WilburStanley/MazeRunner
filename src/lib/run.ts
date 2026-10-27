import { generateMaze } from "./maze/generate";
import { encodeId, parseId } from "./maze/id";
import { isPlausibleDuration, replayMoves, type ReplayFailure } from "./maze/replay";
import { parseNickname } from "./nickname";
import { signToken, verifyToken } from "./tokens";

export type RunError =
  | "invalid-maze-id"
  | "invalid-token"
  | "invalid-nickname"
  | ReplayFailure
  | "implausible-time";

export const RUN_ERROR_STATUS: Record<RunError, number> = {
  "invalid-maze-id": 400,
  "invalid-nickname": 400,
  "invalid-moves": 400,
  "invalid-token": 401,
  "blocked-by-wall": 422,
  "did-not-reach-end": 422,
  "implausible-time": 422,
};

type Failure = { ok: false; error: RunError };
const fail = (error: RunError): Failure => ({ ok: false, error });

export type StartRunResult = { ok: true; mazeId: string; runToken: string } | Failure;

export type FinishRunInput = { runToken: unknown; moves: unknown; nickname: unknown };
export type FinishRunResult =
  | {
      ok: true;
      mazeId: string;
      elapsedMs: number;
      moveCount: number;
      nickname: string | null;
      resultToken: string;
    }
  | Failure;

// The clock and secret are parameters so tests never depend on real time or env vars
export const startRun = (rawMazeId: unknown, nowMs: number, secret: string): StartRunResult => {
  if (typeof rawMazeId !== "string") return fail("invalid-maze-id");
  const spec = parseId(rawMazeId);
  if (spec === null) return fail("invalid-maze-id");

  const mazeId = encodeId(spec);
  const runToken = signToken({ kind: "run", mazeId, startedAtMs: nowMs }, secret);
  return { ok: true, mazeId, runToken };
};

export const finishRun = (input: FinishRunInput, nowMs: number, secret: string): FinishRunResult => {
  if (typeof input.runToken !== "string") return fail("invalid-token");
  const run = verifyToken(input.runToken, secret, "run");
  if (run === null) return fail("invalid-token");

  const nicknameResult = parseNickname(input.nickname);
  if (!nicknameResult.ok) return fail("invalid-nickname");

  const spec = parseId(run.mazeId);
  if (spec === null) return fail("invalid-token");

  const replay = replayMoves(generateMaze(spec), input.moves);
  if (!replay.ok) return fail(replay.reason);

  // Time comes from the server clock only, never from the client
  const elapsedMs = nowMs - run.startedAtMs;
  if (!isPlausibleDuration(replay.moveCount, elapsedMs)) return fail("implausible-time");

  const resultToken = signToken(
    {
      kind: "result",
      mazeId: run.mazeId,
      elapsedMs,
      moveCount: replay.moveCount,
      nickname: nicknameResult.nickname,
    },
    secret,
  );
  return {
    ok: true,
    mazeId: run.mazeId,
    elapsedMs,
    moveCount: replay.moveCount,
    nickname: nicknameResult.nickname,
    resultToken,
  };
};