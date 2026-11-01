"use client";

import Link from "next/link";
import ChallengeSheet from "@/components/play/ChallengeSheet";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import type { FinishRunResponse } from "@/lib/api-client";
import {
  compareToChallenge,
  describeChallengeOutcome,
  type ChallengeTarget,
} from "@/lib/challenge-link";
import { formatDuration } from "@/lib/format";

type ResultPanelProps = {
  result: FinishRunResponse;
  challenge: ChallengeTarget | null;
  onPlayAgain: () => void;
};

const ResultPanel = ({ result, challenge, onPlayAgain }: ResultPanelProps) => {
  const { copied, copy } = useCopyFeedback(result.mazeId);
  const comparison =
    challenge === null ? null : compareToChallenge(result.elapsedMs, challenge.elapsedMs);
  const moveLabel = result.moveCount === 1 ? "move" : "moves";

  return (
    <section className="panel" aria-label="Run result">
      <p className="label tone-ok">Verified run</p>
      <div className="panel-summary">
        <p className="result-time">{formatDuration(result.elapsedMs)}</p>
        <p className="dim small">
          {result.moveCount} {moveLabel}
          {result.nickname !== null ? ` · ${result.nickname}` : ""}
        </p>
      </div>
      {comparison !== null && challenge !== null && (
        <p className={comparison.outcome === "lose" ? "verdict tone-danger" : "verdict tone-ok"}>
          {describeChallengeOutcome(comparison, challenge.nickname)}
        </p>
      )}
      <div className="panel-actions">
        <button type="button" className="button button-primary" onClick={onPlayAgain} autoFocus>
          Play again
        </button>
        <Link href="/" className="button">
          New maze
        </Link>
        <button type="button" className="button" onClick={copy}>
          {copied ? "Copied" : "Copy ID"}
        </button>
      </div>
      <ChallengeSheet result={result} />
    </section>
  );
};

export default ResultPanel;