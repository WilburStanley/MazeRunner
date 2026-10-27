import { describe, it, expect } from "vitest";
import { parseNickname } from "../src/lib/nickname";

describe("parseNickname", () => {
  it("treats a missing or blank nickname as none", () => {
    for (const missing of [undefined, null, "", "   "]) {
      expect(parseNickname(missing)).toEqual({ ok: true, nickname: null });
    }
  });

  it("accepts and trims a valid nickname", () => {
    expect(parseNickname("  Ana_K-2  ")).toEqual({ ok: true, nickname: "Ana_K-2" });
  });

  it("rejects nicknames longer than 20 characters", () => {
    expect(parseNickname("a".repeat(21))).toEqual({ ok: false });
    expect(parseNickname("a".repeat(20))).toEqual({ ok: true, nickname: "a".repeat(20) });
  });

  it("rejects unsafe characters and non-strings", () => {
    for (const unsafe of ["<script>", "Ana\nBob", "José", "😀", 42, {}]) {
      expect(parseNickname(unsafe)).toEqual({ ok: false });
    }
  });
});