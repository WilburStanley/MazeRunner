"use client";

import type { FormEvent } from "react";
import ChallengeBanner from "@/components/play/ChallengeBanner";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import type { ChallengeTarget } from "@/lib/challenge-link";
import { NICKNAME_MAX_LENGTH } from "@/lib/nickname";
import BlankSheetLink from "@/components/BlankSheetLink";

type StartPanelProps = {
  mazeId: string;
  description: string;
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  errorMessage: string | null;
  challenge: ChallengeTarget | null;
  isStarting: boolean;
  onStart: () => void;
};

// Shown instead of the maze until the run starts, so nobody studies the layout on a stopped clock
const StartPanel = ({
  mazeId,
  description,
  nickname,
  onNicknameChange,
  errorMessage,
  challenge,
  isStarting,
  onStart,
}: StartPanelProps) => {
  const { copied, copy } = useCopyFeedback(mazeId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart();
  };

  return (
    <form className="start-panel" onSubmit={handleSubmit}>
      <div className="start-id-block">
        <p className="label">Maze</p>
        <p className="maze-id">{mazeId}</p>
        <p className="dim small">{description}</p>
      </div>

      {challenge !== null && <ChallengeBanner challenge={challenge} />}
      <label className="field-group">
        <span className="label">Nickname, optional</span>
        <input
          className="field"
          value={nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder="anon"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errorMessage !== null}
          onChange={(event) => onNicknameChange(event.target.value)}
        />
      </label>

      {errorMessage !== null && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="start-actions">
        <button type="submit" className="button button-primary" disabled={isStarting} autoFocus>
          {isStarting ? "Starting" : "Start run"}
        </button>
        <button type="button" className="button" onClick={copy}>
          {copied ? "Copied" : "Copy ID"}
        </button>
      </div>

      <p className="dim small">Reach the ring. The clock starts when you press Start.</p>
      <BlankSheetLink mazeId={mazeId} />
    </form>
  );
};

export default StartPanel;