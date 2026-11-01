"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import BlankSheetLink from "@/components/BlankSheetLink";
import Mark from "@/components/Mark";
import MazePreview from "@/components/MazePreview";
import Segmented from "@/components/Segmented";
import { describeApiError, fetchDailyMaze, fetchMaze } from "@/lib/api-client";
import { buildChallengePath, looksLikeChallengeId } from "@/lib/challenge-link";
import { ALGORITHM_INFO, describeSpec } from "@/lib/maze/describe";
import { generateMaze } from "@/lib/maze/generate";
import type { Maze } from "@/lib/maze/grid";
import { ALGORITHMS, encodeId, parseId, randomSeed, type Algorithm } from "@/lib/maze/id";

const ALGORITHM_OPTIONS = ALGORITHMS.map((algorithm) => ({
  value: algorithm,
  label: ALGORITHM_INFO[algorithm].name,
}));
const SIZE_OPTIONS = [11, 21, 31, 41].map((size) => ({ value: size, label: String(size) }));
const DEFAULT_SIZE = 21;

// False while the page is prerendered, true in the browser. Random values stay out of the
// prerender, so there is nothing to mismatch during hydration.
const subscribeNever = () => () => {};
const useIsClient = (): boolean =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

type DailyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; date: string; mazeId: string; maze: Maze };

const HomePage = () => {
  const router = useRouter();
  const [daily, setDaily] = useState<DailyState>({ status: "loading" });
  const [dailyAttempt, setDailyAttempt] = useState(0);
  const [algorithm, setAlgorithm] = useState<Algorithm>("K");
  const [size, setSize] = useState(DEFAULT_SIZE);
  // The preview and "Generate and play" share this seed: the maze you see is the maze you get
  const [seed, setSeed] = useState(randomSeed);
  const isClient = useIsClient();
  const [idInput, setIdInput] = useState("");
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadDaily = async () => {
      const dailyResponse = await fetchDailyMaze();
      if (!dailyResponse.ok) {
        if (!cancelled) {
          setDaily({ status: "error", message: describeApiError(dailyResponse.error) });
        }
        return;
      }

      const { date, mazeId } = dailyResponse.data;
      const mazeResponse = await fetchMaze(mazeId);
      if (cancelled) return;
      setDaily(
        mazeResponse.ok
          ? { status: "ready", date, mazeId, maze: mazeResponse.data.maze }
          : { status: "error", message: describeApiError(mazeResponse.error) },
      );
    };
    void loadDaily();
    return () => {
      cancelled = true;
    };
  }, [dailyAttempt]);

  const handleRetryDaily = () => {
    setDaily({ status: "loading" });
    setDailyAttempt((attempt) => attempt + 1);
  };

  const newSpec = useMemo(
    () => (isClient ? { algorithm, size, seed } : null),
    [isClient, algorithm, size, seed],
  );
  const newMaze = useMemo(() => (newSpec === null ? null : generateMaze(newSpec)), [newSpec]);

  const handleGenerate = () => {
    if (newSpec !== null) router.push(`/play/${encodeId(newSpec)}`);
  };

  const handlePlayById = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A challenge ID is signed by the API, so the challenge page does the real check
    if (looksLikeChallengeId(idInput)) {
      router.push(buildChallengePath(idInput.trim().toUpperCase()));
      return;
    }
    const spec = parseId(idInput);
    if (spec === null) {
      setIdError("That ID is not valid. Check it for typos.");
      return;
    }
    router.push(`/play/${encodeId(spec)}`);
  };

  const dailySpec = daily.status === "ready" ? parseId(daily.mazeId) : null;

  return (
    <main className="home">
      <header className="home-intro">
        <div className="home-title-row">
          <Mark size={40} />
          <h1 className="title">Maze Runner</h1>
        </div>
        <p className="home-lede">
          Every maze is a short ID. Share the ID and everyone plays the same maze. Every time is
          checked, so nobody has to take your word for it.
        </p>
      </header>

      <section className="home-section home-daily" aria-labelledby="daily-heading">
        <h2 id="daily-heading" className="label">
          Daily maze
        </h2>
        <div className="home-daily-body">
          <div className="daily-meta">
            <p className="maze-id">{daily.status === "ready" ? daily.mazeId : "—"}</p>
            {daily.status === "error" ? (
              <p className="small">
                <span className="form-error">{daily.message}</span>{" "}
                <button type="button" className="text-button" onClick={handleRetryDaily}>
                  Retry
                </button>
              </p>
            ) : (
              <p className="dim small">
                {dailySpec !== null && daily.status === "ready"
                  ? `${describeSpec(dailySpec)} · ${daily.date} · changes 00:00 UTC`
                  : "Same maze for everyone, once a day."}
              </p>
            )}
          </div>
          {daily.status === "ready" ? (
            <Link href={`/play/${daily.mazeId}`} className="button button-primary">
              Play daily maze
            </Link>
          ) : (
            <span className="button button-primary" aria-disabled="true">
              Play daily maze
            </span>
          )}
        </div>
      </section>

      <section className="home-section home-new" aria-labelledby="new-heading">
        <h2 id="new-heading" className="label">
          New maze
        </h2>
        <div className="home-new-grid">
          <div className="home-new-controls">
            <Segmented
              legend="Algorithm"
              name="algorithm"
              value={algorithm}
              options={ALGORITHM_OPTIONS}
              onChange={setAlgorithm}
            />
            <p className="dim small">{ALGORITHM_INFO[algorithm].note}</p>
            <Segmented
              legend="Size, cells per side"
              name="size"
              value={size}
              options={SIZE_OPTIONS}
              onChange={setSize}
            />
          </div>

          <div className="home-new-preview">
            <div className="board">
              {newMaze !== null ? (
                <MazePreview
                  maze={newMaze}
                  label={`Preview of a ${size} by ${size} ${ALGORITHM_INFO[algorithm].name} maze`}
                />
              ) : (
                <div className="maze-frame preview-empty">
                  <p className="label">Loading</p>
                </div>
              )}
            </div>
            <p className="maze-id preview-id">{newSpec !== null ? encodeId(newSpec) : "—"}</p>
            <div className="preview-actions">
              {newSpec !== null ? <BlankSheetLink mazeId={encodeId(newSpec)} /> : <span />}
              <button
                type="button"
                className="text-button"
                onClick={() => setSeed(randomSeed())}
              >
                Shuffle
              </button>
            </div>
          </div>

          <div className="home-new-action">
            <button
              type="button"
              className="button button-primary"
              disabled={newSpec === null}
              onClick={handleGenerate}
            >
              Generate and play
            </button>
          </div>

          <form className="home-lookup" noValidate onSubmit={handlePlayById}>
            <label htmlFor="maze-id" className="label">
              Play by maze or challenge ID
            </label>
            <div className="inline-field">
              <input
                id="maze-id"
                className="field"
                value={idInput}
                placeholder="M1-K-21-7QX4D2-F or C1-…"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={idError !== null}
                aria-describedby={idError !== null ? "maze-id-error" : undefined}
                onChange={(event) => {
                  setIdInput(event.target.value);
                  setIdError(null);
                }}
              />
              <button type="submit" className="button">
                Load
              </button>
            </div>
            {idError !== null && (
              <p id="maze-id-error" className="form-error" role="alert">
                {idError}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
};

export default HomePage;