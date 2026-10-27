const NICKNAME_MAX_LENGTH = 20;
const NICKNAME_PATTERN = /^[A-Za-z0-9 _.-]+$/; // plain ASCII, safe for the PDF font

export type NicknameResult = { ok: true; nickname: string | null } | { ok: false };

export const parseNickname = (rawNickname: unknown): NicknameResult => {
  if (rawNickname === undefined || rawNickname === null) return { ok: true, nickname: null };
  if (typeof rawNickname !== "string") return { ok: false };

  const trimmed = rawNickname.trim();
  if (trimmed === "") return { ok: true, nickname: null };
  if (trimmed.length > NICKNAME_MAX_LENGTH || !NICKNAME_PATTERN.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, nickname: trimmed };
};