import { generateBinaryTree } from "./algorithms/binary-tree";
import { generateKruskal } from "./algorithms/kruskal";
import type { Maze } from "./grid";
import { parseId, type Algorithm, type MazeSpec } from "./id";
import { mulberry32, type RandomSource } from "./prng";

const ALGORITHM_GENERATORS: Record<Algorithm, (size: number, nextRandom: RandomSource) => Maze> = {
  K: generateKruskal,
  B: generateBinaryTree,
};

export const generateMaze = ({ algorithm, size, seed }: MazeSpec): Maze =>
  ALGORITHM_GENERATORS[algorithm](size, mulberry32(seed));

export const generateMazeFromId = (rawId: string): Maze | null => {
  const spec = parseId(rawId);
  return spec === null ? null : generateMaze(spec);
};