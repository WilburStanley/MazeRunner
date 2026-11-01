import { formatDuration } from "@/lib/format";

// What a challenge sheet may show. Each switch is a plain on/off: the name and the time
// themselves come from the signed result code, never from the address.
export type ChallengeOptions = {
  showName: boolean;
  showTime: boolean;
  showRoute: boolean; // the route is the answer, so it defaults to off
  showMazeId: boolean;
};

export const DEFAULT_CHALLENGE_OPTIONS: ChallengeOptions = {
  showName: true,
  showTime: true,
  showRoute: false,
  showMazeId: true,
};

const OPTION_PARAMETERS: Record<keyof ChallengeOptions, string> = {
  showName: "name",
  showTime: "time",
  showRoute: "path",
  showMazeId: "seed",
};

const OPTION_KEYS = Object.keys(OPTION_PARAMETERS) as (keyof ChallengeOptions)[];

// Only "1" and "0" mean anything. Everything else, including a typed-in name or time, is ignored.
export const parseChallengeOptions = (searchParams: URLSearchParams): ChallengeOptions => {
  const options = { ...DEFAULT_CHALLENGE_OPTIONS };
  for (const key of OPTION_KEYS) {
    const value = searchParams.get(OPTION_PARAMETERS[key]);
    if (value === "1") options[key] = true;
    else if (value === "0") options[key] = false;
  }
  return options;
};

export const buildChallengeQuery = (resultCode: string, options: ChallengeOptions): string => {
  const searchParams = new URLSearchParams({ code: resultCode });
  for (const key of OPTION_KEYS) {
    searchParams.set(OPTION_PARAMETERS[key], options[key] ? "1" : "0");
  }
  return searchParams.toString();
};

export type VerifiedResult = { mazeId: string; elapsedMs: number; nickname: string | null };

export type ChallengeContent = {
  headline: string;
  timeText: string | null;
  showRoute: boolean;
  showMazeId: boolean;
};

// Decides exactly what gets printed. A value that is missing or switched off never appears.
export const resolveChallengeContent = (
  result: VerifiedResult,
  options: ChallengeOptions,
): ChallengeContent => {
  const nameText = options.showName ? result.nickname : null;
  const timeText = options.showTime ? formatDuration(result.elapsedMs) : null;

  let headline = "Can you solve this maze?";
  if (nameText !== null) headline = `Can you beat ${nameText}'s time?`;
  else if (timeText !== null) headline = "Can you beat this time?";

  return { headline, timeText, showRoute: options.showRoute, showMazeId: options.showMazeId };
};