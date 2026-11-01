import type { Algorithm, MazeSpec } from "./id";

// One place for the player-facing names, so the menu and the play screen agree
export const ALGORITHM_INFO: Record<Algorithm, { name: string; note: string }> = {
  K: { name: "Kruskal", note: "Winding passages with many dead ends." },
  B: { name: "Binary Tree", note: "Open top and right edges, steady diagonal bias." },
};

export const describeSpec = ({ algorithm, size }: MazeSpec): string =>
  `${size} × ${size} · ${ALGORITHM_INFO[algorithm].name}`;