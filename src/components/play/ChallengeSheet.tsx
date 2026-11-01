"use client";

import { useState } from "react";
import BlankSheetLink from "@/components/BlankSheetLink";
import CopyButton from "@/components/CopyButton";
import type { FinishRunResponse } from "@/lib/api-client";
import { buildChallengePath } from "@/lib/challenge-link";
import {
  DEFAULT_CHALLENGE_OPTIONS,
  buildChallengeQuery,
  type ChallengeOptions,
} from "@/lib/pdf/challenge-options";

type ChallengeSheetProps = { result: FinishRunResponse };

type OptionRow = {
  key: keyof ChallengeOptions;
  label: string;
  hint: string | null;
  isAvailable: boolean;
};

// Two ways to challenge someone: share the signed challenge ID (online), or print a sheet.
// Both carry the same verified time, so nobody can make up a score.
const ChallengeSheet = ({ result }: ChallengeSheetProps) => {
  const [options, setOptions] = useState<ChallengeOptions>(DEFAULT_CHALLENGE_OPTIONS);

  const toggleOption = (key: keyof ChallengeOptions) =>
    setOptions((current) => ({ ...current, [key]: !current[key] }));

  const rows: OptionRow[] = [
    {
      key: "showName",
      label: result.nickname === null ? "Name" : `Name (${result.nickname})`,
      hint: null,
      isAvailable: result.nickname !== null,
    },
    { key: "showTime", label: "Time to beat", hint: null, isAvailable: true },
    { key: "showMazeId", label: "Maze ID and play link", hint: null, isAvailable: true },
    {
      key: "showRoute",
      label: "Route",
      hint: "Draws the answer on the maze, so it is off unless you want it.",
      isAvailable: true,
    },
  ];

  const downloadHref = `/api/challenge/pdf?${buildChallengeQuery(result.resultToken, options)}`;
  const challengeLink = `${window.location.origin}${buildChallengePath(result.challengeId)}`;

  return (
    <details className="challenge" open>
      <summary className="challenge-summary">Challenge a friend</summary>
      <div className="challenge-body">
        <div className="challenge-online">
          <p className="label">Challenge ID</p>
          <p className="maze-id">{result.challengeId}</p>
          <p className="dim small">
            Anyone with this ID plays your maze and sees your time to beat.
          </p>
          <div className="challenge-actions">
            <CopyButton text={challengeLink} label="Copy link" />
            <CopyButton text={result.challengeId} label="Copy ID" />
          </div>
        </div>

        <fieldset className="challenge-options">
          <legend className="label">Or print a sheet. Show on it:</legend>
          {rows
            .filter((row) => row.isAvailable)
            .map((row) => (
              <label key={row.key} className="check">
                <input
                  type="checkbox"
                  checked={options[row.key]}
                  onChange={() => toggleOption(row.key)}
                />
                <span>{row.label}</span>
                {row.hint !== null && <span className="dim small check-hint">{row.hint}</span>}
              </label>
            ))}
        </fieldset>
        <div className="challenge-actions">
          <a className="button" href={downloadHref} download>
            Download challenge sheet
          </a>
          <BlankSheetLink mazeId={result.mazeId} />
        </div>
      </div>
    </details>
  );
};

export default ChallengeSheet;