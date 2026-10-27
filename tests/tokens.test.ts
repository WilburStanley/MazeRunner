import { describe, it, expect } from "vitest";
import {
  signToken,
  verifyToken,
  type ResultTokenPayload,
  type RunTokenPayload,
} from "../src/lib/tokens";

const TEST_SECRET = "unit-test-secret-not-a-real-one";
const OTHER_SECRET = "another-unit-test-secret";

const runPayload: RunTokenPayload = {
  kind: "run",
  mazeId: "M1-K-21-7QX4D2-F",
  startedAtMs: 1_700_000_000_000,
};

const resultPayload: ResultTokenPayload = {
  kind: "result",
  mazeId: "M1-K-21-7QX4D2-F",
  elapsedMs: 42_000,
  moveCount: 120,
  nickname: "Ana",
};

describe("signed tokens", () => {
  it("round-trips a run token", () => {
    expect(verifyToken(signToken(runPayload, TEST_SECRET), TEST_SECRET, "run")).toEqual(
      runPayload,
    );
  });

  it("round-trips a result token", () => {
    expect(verifyToken(signToken(resultPayload, TEST_SECRET), TEST_SECRET, "result")).toEqual(
      resultPayload,
    );
  });

  it("rejects a payload modified after signing", () => {
    const token = signToken(runPayload, TEST_SECRET);
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...runPayload, startedAtMs: 0 }),
    ).toString("base64url");
    expect(verifyToken(`${forgedPayload}.${signature}`, TEST_SECRET, "run")).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signToken(runPayload, TEST_SECRET);
    const [payload] = token.split(".");
    expect(verifyToken(`${payload}.AAAA`, TEST_SECRET, "run")).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    expect(verifyToken(signToken(runPayload, OTHER_SECRET), TEST_SECRET, "run")).toBeNull();
  });

  it("rejects a token of the wrong kind", () => {
    expect(verifyToken(signToken(runPayload, TEST_SECRET), TEST_SECRET, "result")).toBeNull();
    expect(verifyToken(signToken(resultPayload, TEST_SECRET), TEST_SECRET, "run")).toBeNull();
  });

  it("rejects garbage input", () => {
    for (const garbage of ["", "abc", "a.b.c", ".", "..."]) {
      expect(verifyToken(garbage, TEST_SECRET, "run")).toBeNull();
    }
  });
});