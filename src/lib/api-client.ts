import type { Direction, Maze } from "./maze/grid";

export type ApiResult<Data> = { ok: true; data: Data } | { ok: false; error: string };

export type MazeResponse = { id: string; maze: Maze };
export type DailyResponse = { date: string; mazeId: string };
export type StartRunResponse = { mazeId: string; runToken: string };
export type FinishRunPayload = {
  runToken: string;
  moves: Direction[];
  nickname: string | null;
};
export type FinishRunResponse = {
  mazeId: string;
  elapsedMs: number;
  moveCount: number;
  nickname: string | null;
  resultToken: string;
  challengeId: string;
};

const requestJson = async <Data>(url: string, init?: RequestInit): Promise<ApiResult<Data>> => {
  try {
    const response = await fetch(url, init);
    const body: unknown = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: body as Data };

    const hasErrorCode =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string";
    return { ok: false, error: hasErrorCode ? (body as { error: string }).error : "unknown-error" };
  } catch {
    return { ok: false, error: "network-error" };
  }
};

const postJson = <Data>(url: string, payload: unknown): Promise<ApiResult<Data>> =>
  requestJson<Data>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const fetchMaze = (mazeId: string) =>
  requestJson<MazeResponse>(`/api/maze/${encodeURIComponent(mazeId)}`);

export const fetchDailyMaze = () => requestJson<DailyResponse>("/api/daily");

export const startRunRequest = (mazeId: string) =>
  postJson<StartRunResponse>("/api/run/start", { mazeId });

export const finishRunRequest = (payload: FinishRunPayload) =>
  postJson<FinishRunResponse>("/api/run/finish", payload);

const ERROR_MESSAGES = new Map<string, string>([
  ["invalid-maze-id", "That maze ID is not valid."],
  ["invalid-token", "This run expired or is invalid. Start a new run."],
  ["invalid-nickname", "Nickname: up to 20 letters, numbers, spaces, . _ -"],
  ["invalid-moves", "The recorded moves were rejected. Try again."],
  ["blocked-by-wall", "The recorded moves were rejected. Try again."],
  ["did-not-reach-end", "The recorded moves did not reach the finish."],
  ["implausible-time", "That run was rejected as too fast or too old. Try again."],
  ["network-error", "Network problem. Check your connection and try again."],
]);

export const describeApiError = (errorCode: string): string =>
  ERROR_MESSAGES.get(errorCode) ?? "Something went wrong. Try again.";