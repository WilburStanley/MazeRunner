import { createHmac, timingSafeEqual } from "node:crypto";

const HASH_ALGORITHM = "sha256";
const TOKEN_ENCODING = "base64url";
const TOKEN_SEPARATOR = ".";

// "kind" stops a run token from being accepted where a result token is expected
export type RunTokenPayload = { kind: "run"; mazeId: string; startedAtMs: number };
export type ResultTokenPayload = {
  kind: "result";
  mazeId: string;
  elapsedMs: number;
  moveCount: number;
  nickname: string | null;
};

type PayloadByKind = { run: RunTokenPayload; result: ResultTokenPayload };
export type TokenKind = keyof PayloadByKind;

export const getSigningSecret = (): string => {
  const secret = process.env.SIGNING_SECRET;
  if (!secret) throw new Error("SIGNING_SECRET is not set");
  return secret;
};

const computeSignature = (encodedPayload: string, secret: string): Buffer =>
  createHmac(HASH_ALGORITHM, secret).update(encodedPayload).digest();

export const signToken = (
  payload: RunTokenPayload | ResultTokenPayload,
  secret: string,
): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(TOKEN_ENCODING);
  const encodedSignature = computeSignature(encodedPayload, secret).toString(TOKEN_ENCODING);
  return `${encodedPayload}${TOKEN_SEPARATOR}${encodedSignature}`;
};

export const verifyToken = <Kind extends TokenKind>(
  token: string,
  secret: string,
  expectedKind: Kind,
): PayloadByKind[Kind] | null => {
  const parts = token.split(TOKEN_SEPARATOR);
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;

  const expectedSignature = computeSignature(encodedPayload, secret);
  const providedSignature = Buffer.from(encodedSignature, TOKEN_ENCODING);
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, TOKEN_ENCODING).toString("utf8"));
    return payload?.kind === expectedKind ? (payload as PayloadByKind[Kind]) : null;
  } catch {
    return null;
  }
};