export const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I, L, O, U
export const ALPHABET_BASE = ALPHABET.length; // 32
export const VERSION = "M1";
export const ALGORITHMS = ["K", "B", "P"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];
export const MIN_SIZE = 5;
export const MAX_SIZE = 51;

const SEED_LENGTH = 6;
const ID_SEPARATOR = "-";
const ID_PART_COUNT = 5;
const SIZE_PATTERN = /^[1-9]\d?$/; // 1-2 digits, no leading zero

export const SEED_MAX = ALPHABET_BASE ** SEED_LENGTH; // seeds are 0 .. SEED_MAX - 1

export type MazeSpec = { algorithm: Algorithm; size: number; seed: number };

const isAlgorithm = (value: string): value is Algorithm =>
  (ALGORITHMS as readonly string[]).includes(value);

export const encodeSeed = (seed: number): string => {
  let encoded = "";
  let remaining = seed;
  for (let position = 0; position < SEED_LENGTH; position++) {
    encoded = ALPHABET[remaining % ALPHABET_BASE] + encoded;
    remaining = Math.floor(remaining / ALPHABET_BASE);
  }
  return encoded;
};

export const decodeSeed = (encoded: string): number | null => {
  if (encoded.length !== SEED_LENGTH) return null;
  let seed = 0;
  for (const character of encoded) {
    const digit = ALPHABET.indexOf(character);
    if (digit < 0) return null;
    seed = seed * ALPHABET_BASE + digit;
  }
  return seed;
};

const buildBody = (algorithm: string, size: string, encodedSeed: string): string =>
  [VERSION, algorithm, size, encodedSeed].join(ID_SEPARATOR);

const computeChecksum = (body: string): string => {
  let weightedSum = 0;
  for (let index = 0; index < body.length; index++) {
    weightedSum = (weightedSum + body.charCodeAt(index) * (index + 1)) % ALPHABET_BASE;
  }
  return ALPHABET[weightedSum];
};

export const encodeId = ({ algorithm, size, seed }: MazeSpec): string => {
  const body = buildBody(algorithm, String(size), encodeSeed(seed));
  return `${body}${ID_SEPARATOR}${computeChecksum(body)}`;
};

export const parseId = (rawId: string): MazeSpec | null => {
  const parts = rawId.trim().toUpperCase().split(ID_SEPARATOR);
  if (parts.length !== ID_PART_COUNT) return null;

  const [version, algorithm, sizeText, seedText, checksum] = parts;
  if (version !== VERSION) return null;
  if (!isAlgorithm(algorithm)) return null;
  if (!SIZE_PATTERN.test(sizeText)) return null;

  const size = Number(sizeText);
  if (size < MIN_SIZE || size > MAX_SIZE) return null;

  const seed = decodeSeed(seedText);
  if (seed === null) return null;

  const expectedChecksum = computeChecksum(buildBody(algorithm, sizeText, seedText));
  if (checksum !== expectedChecksum) return null;

  return { algorithm, size, seed };
};

// Only for picking a NEW maze. Generation itself never uses Math.random.
export const randomSeed = (): number => Math.floor(Math.random() * SEED_MAX);