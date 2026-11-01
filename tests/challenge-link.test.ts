import { describe, expect, it } from "vitest";
import {
  buildChallengePath,
  compareToChallenge,
  describeChallengeOutcome,
  looksLikeChallengeId,
} from "../src/lib/challenge-link";

describe("looksLikeChallengeId", () => {
  it("tells challenge IDs from maze IDs", () => {
    expect(looksLikeChallengeId("C1-K-21-7QX4D2-1F4G-0-ABCDEFGHJK")).toBe(true);
    expect(looksLikeChallengeId("  c1-k-21")).toBe(true);
    expect(looksLikeChallengeId("M1-K-21-7QX4D2-F")).toBe(false);
    expect(looksLikeChallengeId("")).toBe(false);
  });
});

describe("buildChallengePath", () => {
  it("points at the challenge page and escapes odd input", () => {
    expect(buildChallengePath("C1-K-21")).toBe("/challenge/C1-K-21");
    expect(buildChallengePath("a/b?c")).toBe("/challenge/a%2Fb%3Fc");
  });
});

describe("compareToChallenge", () => {
  it("is a win when faster, by whole tenths", () => {
    expect(compareToChallenge(38_000, 41_200)).toEqual({ outcome: "win", differenceTenths: 32 });
  });

  it("is a loss when slower", () => {
    expect(compareToChallenge(42_300, 41_200)).toEqual({ outcome: "lose", differenceTenths: 11 });
  });

  it("is a tie when the shown tenths match", () => {
    expect(compareToChallenge(41_240, 41_299)).toEqual({ outcome: "tie", differenceTenths: 0 });
  });
});

describe("describeChallengeOutcome", () => {
  it("names the challenger", () => {
    expect(describeChallengeOutcome({ outcome: "win", differenceTenths: 32 }, "Ana")).toBe(
      "You beat Ana by 3.2s",
    );
    expect(describeChallengeOutcome({ outcome: "lose", differenceTenths: 11 }, "Ana")).toBe(
      "Ana wins by 1.1s",
    );
    expect(describeChallengeOutcome({ outcome: "tie", differenceTenths: 0 }, "Ana")).toBe(
      "Dead heat with Ana",
    );
  });

  it("works without a name", () => {
    expect(describeChallengeOutcome({ outcome: "win", differenceTenths: 5 }, null)).toBe(
      "You beat the challenge by 0.5s",
    );
    expect(describeChallengeOutcome({ outcome: "lose", differenceTenths: 5 }, null)).toBe(
      "The challenge holds by 0.5s",
    );
  });
});