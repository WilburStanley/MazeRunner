import { carvePassage, createWalledMaze, type Direction, type Maze } from "../grid";
import { randomIntBelow, type RandomSource } from "../prng";

// Every cell opens north or east (whichever exist). Simple and fast, but biased.
export const generateBinaryTree = (size: number, nextRandom: RandomSource): Maze => {
  const maze = createWalledMaze(size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const options: Direction[] = [];
      if (row > 0) options.push("north");
      if (column < size - 1) options.push("east");
      if (options.length === 0) continue;
      const chosenDirection = options[randomIntBelow(nextRandom, options.length)];
      carvePassage(maze, { row, column }, chosenDirection);
    }
  }
  return maze;
};