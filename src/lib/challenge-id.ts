import { createHmac, timingSafeEqual } from "node:crypto";
import { CHALLENGE_VERSION, type ChallengeTarget } from "./challenge-link";
import {
  ALPHABET,
  ALPHABET_BASE,
  buildBody,
  computeChecksum,
  encodeSeed,
  parseId,
  type MazeSpec,
} from "./maze/id";
import { parseNickname } from "./nickname";

// A challenge ID carries everything a friend needs, so nothing has to be stored anywhere:
//   C1-K-21-7QX4D2-1F4G-MJTG-ABCD123456
//   version, algorithm, size, seed, time (ms), nickname (or 0), signature
// The signature is a keyed hash of everything before it, so the time and name cannot be edited.

const SEPARATOR = "-";
const PART_COUNT = 7;
const NO_NICKNAME = "0";
const MAX_TIME_SYMBOLS = 8;
const SIGNATURE_BYTES = 6;
const SIGNATURE_CONTEXT = "challenge";

const BITS_PER_BYTE = 8;
const BITS_PER_SYMBOL = 5;
const SYMBOL_MASK = ALPHABET_BASE - 1;
const BYTE_MASK = 0xff;

export type ChallengeDetails = ChallengeTarget & { mazeId: string };
export type ChallengeInput = { spec: MazeSpec; elapsedMs: number; nickname: string | null };

const encodeBytes = (bytes: Uint8Array): string => {
  let bitBuffer = 0;
  let bitCount = 0;
  let encoded = "";
  for (const byte of bytes) {
    bitBuffer = (bitBuffer << BITS_PER_BYTE) | byte;
    bitCount += BITS_PER_BYTE;
    while (bitCount >= BITS_PER_SYMBOL) {
      bitCount -= BITS_PER_SYMBOL;
      encoded += ALPHABET[(bitBuffer >> bitCount) & SYMBOL_MASK];
    }
    bitBuffer &= (1 << bitCount) - 1;
  }
  if (bitCount > 0) {
    encoded += ALPHABET[(bitBuffer << (BITS_PER_SYMBOL - bitCount)) & SYMBOL_MASK];
  }
  return encoded;
};

const decodeBytes = (encoded: string): Uint8Array | null => {
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  for (const symbol of encoded) {
    const digit = ALPHABET.indexOf(symbol);
    if (digit < 0) return null;
    bitBuffer = (bitBuffer << BITS_PER_SYMBOL) | digit;
    bitCount += BITS_PER_SYMBOL;
    if (bitCount >= BITS_PER_BYTE) {
      bitCount -= BITS_PER_BYTE;
      bytes.push((bitBuffer >> bitCount) & BYTE_MASK);
      bitBuffer &= (1 << bitCount) - 1;
    }
  }
  const hasNonZeroPadding = bitBuffer !== 0;
  return hasNonZeroPadding ? null : Uint8Array.from(bytes);
};

const encodeNumber = (value: number): string => {
  if (value === 0) return ALPHABET[0];
  let encoded = "";
  let remaining = value;
  while (remaining > 0) {
    encoded = ALPHABET[remaining % ALPHABET_BASE] + encoded;
    remaining = Math.floor(remaining / ALPHABET_BASE);
  }
  return encoded;
};

const decodeNumber = (encoded: string): number | null => {
  if (encoded.length === 0 || encoded.length > MAX_TIME_SYMBOLS) return null;
  if (encoded.length > 1 && encoded[0] === ALPHABET[0]) return null; // one spelling per number
  let value = 0;
  for (const symbol of encoded) {
    const digit = ALPHABET.indexOf(symbol);
    if (digit < 0) return null;
    value = value * ALPHABET_BASE + digit;
  }
  return value;
};

const encodeNickname = (nickname: string | null): string =>
  nickname === null ? NO_NICKNAME : encodeBytes(Buffer.from(nickname, "ascii"));

const decodeNickname = (encoded: string): { ok: true; nickname: string | null } | { ok: false } => {
  if (encoded === NO_NICKNAME) return { ok: true, nickname: null };
  const bytes = decodeBytes(encoded);
  if (bytes === null) return { ok: false };
  const parsed = parseNickname(Buffer.from(bytes).toString("ascii"));
  // Must re-encode to the same text, so every nickname has exactly one valid spelling
  const isCanonical = parsed.ok && parsed.nickname !== null && encodeNickname(parsed.nickname) === encoded;
  return isCanonical && parsed.ok ? { ok: true, nickname: parsed.nickname } : { ok: false };
};

const computeSignature = (body: string, secret: string): string => {
  const digest = createHmac("sha256", secret).update(`${SIGNATURE_CONTEXT}:${body}`).digest();
  return encodeBytes(digest.subarray(0, SIGNATURE_BYTES));
};

export const encodeChallengeId = (
  { spec, elapsedMs, nickname }: ChallengeInput,
  secret: string,
): string => {
  const body = [
    CHALLENGE_VERSION,
    spec.algorithm,
    String(spec.size),
    encodeSeed(spec.seed),
    encodeNumber(elapsedMs),
    encodeNickname(nickname),
  ].join(SEPARATOR);
  return `${body}${SEPARATOR}${computeSignature(body, secret)}`;
};

const signaturesMatch = (provided: string, expected: string): boolean =>
  provided.length === expected.length &&
  timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

// Returns null for anything that is malformed, edited or signed with another secret
export const parseChallengeId = (rawId: string, secret: string): ChallengeDetails | null => {
  const parts = rawId.trim().toUpperCase().split(SEPARATOR);
  if (parts.length !== PART_COUNT) return null;

  const [version, algorithm, size, seed, time, nicknameText, signature] = parts;
  if (version !== CHALLENGE_VERSION) return null;

  const body = parts.slice(0, -1).join(SEPARATOR);
  if (!signaturesMatch(signature, computeSignature(body, secret))) return null;

  // Rebuild the maze ID (its own checksum included) and let the normal parser vet it
  const mazeBody = buildBody(algorithm, size, seed);
  const mazeId = `${mazeBody}${SEPARATOR}${computeChecksum(mazeBody)}`;
  if (parseId(mazeId) === null) return null;

  const elapsedMs = decodeNumber(time);
  if (elapsedMs === null) return null;
  const nickname = decodeNickname(nicknameText);
  if (!nickname.ok) return null;

  return { mazeId, elapsedMs, nickname: nickname.nickname };
};