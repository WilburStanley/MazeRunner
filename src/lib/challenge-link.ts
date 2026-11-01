// Safe to import from client components: no secrets and no Node-only code in this file.

export const CHALLENGE_VERSION = "C1";
export const CHALLENGE_ID_PREFIX = `${CHALLENGE_VERSION}-`;

// What a friend needs to beat: the time and, if given, the name. Always read from a signed ID.
export type ChallengeTarget = { elapsedMs: number; nickname: string | null };

// A cheap shape check so the home page can route the input. The signature is only ever
// checked by the API side, which holds the secret.
export const looksLikeChallengeId = (rawId: string): boolean =>
  rawId.trim().toUpperCase().startsWith(CHALLENGE_ID_PREFIX);

export const buildChallengePath = (challengeId: string): string =>
  `/challenge/${encodeURIComponent(challengeId)}`;

export type ChallengeOutcome = { outcome: "win" | "lose" | "tie"; differenceTenths: number };

const MS_PER_TENTH = 100;

// Compared in the tenths the player sees, so "00:41.2 vs 00:41.2" is never called a win
export const compareToChallenge = (
  yourElapsedMs: number,
  challengeElapsedMs: number,
): ChallengeOutcome => {
  const yourTenths = Math.floor(yourElapsedMs / MS_PER_TENTH);
  const challengeTenths = Math.floor(challengeElapsedMs / MS_PER_TENTH);
  const differenceTenths = Math.abs(yourTenths - challengeTenths);
  if (differenceTenths === 0) return { outcome: "tie", differenceTenths };
  return { outcome: yourTenths < challengeTenths ? "win" : "lose", differenceTenths };
};

export const describeChallengeOutcome = (
  { outcome, differenceTenths }: ChallengeOutcome,
  challengerName: string | null,
): string => {
  const seconds = (differenceTenths / 10).toFixed(1);
  const rival = challengerName ?? "the challenge";
  if (outcome === "tie") return `Dead heat with ${rival}`;
  if (outcome === "win") return `You beat ${rival} by ${seconds}s`;
  return challengerName === null
    ? `The challenge holds by ${seconds}s`
    : `${challengerName} wins by ${seconds}s`;
};