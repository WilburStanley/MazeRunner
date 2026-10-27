import {
  carvePassage,
  createWalledMaze,
  getNeighbor,
  type Direction,
  type Maze,
  type Position,
} from "../grid";
import { shuffleInPlace, type RandomSource } from "../prng";

type Wall = { position: Position; direction: Direction };

const buildInternalWalls = (size: number): Wall[] => {
  const walls: Wall[] = [];
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (column < size - 1) walls.push({ position: { row, column }, direction: "east" });
      if (row < size - 1) walls.push({ position: { row, column }, direction: "south" });
    }
  }
  return walls;
};

// Union-find: tracks which cells are already connected
const createDisjointSets = (cellCount: number) => {
  const parents = Array.from({ length: cellCount }, (_cell, index) => index);

  const findRoot = (cellIndex: number): number => {
    let root = cellIndex;
    while (parents[root] !== root) root = parents[root];
    let current = cellIndex;
    while (parents[current] !== root) {
      const next = parents[current];
      parents[current] = root;
      current = next;
    }
    return root;
  };

  // Returns true only if the two cells were not connected before
  const union = (firstCell: number, secondCell: number): boolean => {
    const firstRoot = findRoot(firstCell);
    const secondRoot = findRoot(secondCell);
    if (firstRoot === secondRoot) return false;
    parents[secondRoot] = firstRoot;
    return true;
  };

  return { union };
};

// Shuffle all walls, remove each one only if it joins two separate regions
export const generateKruskal = (size: number, nextRandom: RandomSource): Maze => {
  const maze = createWalledMaze(size);
  const walls = buildInternalWalls(size);
  shuffleInPlace(walls, nextRandom);
  const disjointSets = createDisjointSets(size * size);

  for (const wall of walls) {
    const neighbor = getNeighbor(wall.position, wall.direction);
    const cellIndex = wall.position.row * size + wall.position.column;
    const neighborIndex = neighbor.row * size + neighbor.column;
    if (disjointSets.union(cellIndex, neighborIndex)) {
      carvePassage(maze, wall.position, wall.direction);
    }
  }
  return maze;
};