import { afterEach, describe, it, expect, vi } from "vitest";
import { GET as getDaily } from "@/app/api/daily/route";
import { GET as getMaze } from "@/app/api/maze/[id]/route";
import { POST as postFinish } from "@/app/api/run/finish/route";
import { POST as postStart } from "@/app/api/run/start/route";
import { IMMUTABLE_CACHE_CONTROL, NO_STORE_CACHE_CONTROL } from "@/lib/http";
import { getDailyId } from "@/lib/maze/daily";
import { generateMaze } from "@/lib/maze/generate";
import { encodeId } from "@/lib/maze/id";
import { MIN_MS_PER_MOVE } from "@/lib/maze/replay";
import { solveToMoves } from "./helpers";

const TEST_SECRET = "api-test-secret-not-real";
const MAZE_SPEC = { algorithm: "K" as const, size: 21, seed: 12345 };
const MAZE_ID = encodeId(MAZE_SPEC);
const START_TIME_MS = new Date("2026-10-27T12:00:00Z").getTime();
const solutionMoves = solveToMoves(generateMaze(MAZE_SPEC));
const REALISTIC_ELAPSED_MS = solutionMoves.length * MIN_MS_PER_MOVE * 4;

const buildJsonRequest = (path: string, payload: unknown): Request =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const callGetMaze = (mazeId: string) =>
  getMaze(new Request(`http://localhost/api/maze/${mazeId}`), {
    params: Promise.resolve({ id: mazeId }),
  });

// Only Date is faked, so promises and timers behave normally
const setClock = (timeMs: number): void => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(timeMs);
};

const startRunViaApi = async (): Promise<string> => {
  vi.stubEnv("SIGNING_SECRET", TEST_SECRET);
  setClock(START_TIME_MS);
  const response = await postStart(buildJsonRequest("/api/run/start", { mazeId: MAZE_ID }));
  const body = await response.json();
  return body.runToken;
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("GET /api/maze/[id]", () => {
  it("returns the maze with immutable cache headers", async () => {
    const response = await callGetMaze(MAZE_ID);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(IMMUTABLE_CACHE_CONTROL);
    const body = await response.json();
    expect(body.id).toBe(MAZE_ID);
    expect(body.maze.size).toBe(MAZE_SPEC.size);
  });

  it("returns identical bytes for the same id", async () => {
    const firstBody = await (await callGetMaze(MAZE_ID)).text();
    const secondBody = await (await callGetMaze(MAZE_ID)).text();
    expect(firstBody).toBe(secondBody);
  });

  it("rejects an invalid id and does not cache the error", async () => {
    const response = await callGetMaze("not-an-id");
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe(NO_STORE_CACHE_CONTROL);
  });
});

describe("GET /api/daily", () => {
  it("returns today's UTC date and its maze id", async () => {
    setClock(START_TIME_MS);
    const body = await getDaily().json();
    expect(body.date).toBe("2026-10-27");
    expect(body.mazeId).toBe(getDailyId(new Date(START_TIME_MS)));
  });
});

describe("run endpoints", () => {
  it("completes a full run and uses the server clock, not the client's", async () => {
    const runToken = await startRunViaApi();
    setClock(START_TIME_MS + REALISTIC_ELAPSED_MS);

    const response = await postFinish(
      buildJsonRequest("/api/run/finish", {
        runToken,
        moves: solutionMoves,
        nickname: "Ana",
        elapsedMs: 1, // a claimed time must be ignored
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(NO_STORE_CACHE_CONTROL);
    const body = await response.json();
    expect(body.elapsedMs).toBe(REALISTIC_ELAPSED_MS);
    expect(typeof body.resultToken).toBe("string");
  });

  it("rejects an impossibly fast finish with 422", async () => {
    const runToken = await startRunViaApi();
    setClock(START_TIME_MS + solutionMoves.length * MIN_MS_PER_MOVE - 1);

    const response = await postFinish(
      buildJsonRequest("/api/run/finish", { runToken, moves: solutionMoves }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe("implausible-time");
  });

  it("rejects a tampered token with 401", async () => {
    const runToken = await startRunViaApi();
    setClock(START_TIME_MS + REALISTIC_ELAPSED_MS);

    const response = await postFinish(
      buildJsonRequest("/api/run/finish", { runToken: `${runToken}x`, moves: solutionMoves }),
    );
    expect(response.status).toBe(401);
  });

  it("rejects a body that is not valid JSON with 400", async () => {
    vi.stubEnv("SIGNING_SECRET", TEST_SECRET);
    const brokenRequest = new Request("http://localhost/api/run/start", {
      method: "POST",
      body: "{not json",
    });
    const response = await postStart(brokenRequest);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid-json");
  });

  it("fails loudly when SIGNING_SECRET is missing", async () => {
    vi.stubEnv("SIGNING_SECRET", "");
    await expect(
      postStart(buildJsonRequest("/api/run/start", { mazeId: MAZE_ID })),
    ).rejects.toThrow("SIGNING_SECRET");
  });
});