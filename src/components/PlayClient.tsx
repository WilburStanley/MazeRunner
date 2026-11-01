"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DirectionPad from "@/components/DirectionPad";
import Mark from "@/components/Mark";
import MazeCanvas, { type BoardFeedback } from "@/components/MazeCanvas";
import ErrorPanel from "@/components/play/ErrorPanel";
import ResultPanel from "@/components/play/ResultPanel";
import StartPanel from "@/components/play/StartPanel";
import StatBar, { type StatTone } from "@/components/play/StatBar";
import { useHeldDirection } from "@/hooks/useHeldDirection";
import {
  describeApiError,
  fetchMaze,
  finishRunRequest,
  startRunRequest,
  type FinishRunResponse,
} from "@/lib/api-client";
import type { ChallengeTarget } from "@/lib/challenge-link";
import { isTypingTarget } from "@/lib/dom";
import { formatDuration } from "@/lib/format";
import { describeSpec } from "@/lib/maze/describe";
import type { Direction, Maze } from "@/lib/maze/grid";
import { parseId } from "@/lib/maze/id";
import { MIN_MS_PER_MOVE } from "@/lib/maze/replay";
import {
  applyStep,
  createInitialRunState,
  hasReachedEnd,
  type RunState,
} from "@/lib/maze/run-state";
import { parseNickname } from "@/lib/nickname";

type RunPhase = "loading" | "ready" | "starting" | "playing" | "submitting" | "finished" | "error";

const PHASE_PRESENTATION: Record<RunPhase, { label: string; tone: StatTone }> = {
  loading: { label: "Loading", tone: "default" },
  ready: { label: "Ready", tone: "default" },
  starting: { label: "Starting", tone: "default" },
  playing: { label: "Running", tone: "signal" },
  submitting: { label: "Verifying", tone: "signal" },
  finished: { label: "Verified", tone: "ok" },
  error: { label: "Error", tone: "danger" },
};

// Always a little above the API's minimum, so honest play is never rejected
const MIN_STEP_GAP_MS = MIN_MS_PER_MOVE + 10;
const BUMP_COOLDOWN_MS = 140;
const TIMER_REFRESH_MS = 100;
const NO_BUMP: BoardFeedback = { bumpDirection: null, bumpAt: 0 };

type PlayClientProps = { mazeId: string; challenge?: ChallengeTarget | null };

const PlayClient = ({ mazeId, challenge = null }: PlayClientProps) => {
  const [phase, setPhase] = useState<RunPhase>("loading");
  const [maze, setMaze] = useState<Maze | null>(null);
  const [runState, setRunState] = useState<RunState>(createInitialRunState);
  const [nickname, setNickname] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FinishRunResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isStartPanelOpen, setIsStartPanelOpen] = useState(true);

  const phaseRef = useRef<RunPhase>("loading");
  const runStateRef = useRef<RunState>(runState);
  const runTokenRef = useRef<string | null>(null);
  const nicknameToSendRef = useRef<string | null>(null);
  const clientStartRef = useRef(0);
  const lastStepAtRef = useRef(0);
  const feedbackRef = useRef<BoardFeedback>(NO_BUMP);

  // The ref changes immediately so a late key press cannot slip in after the finish
  const changePhase = useCallback((nextPhase: RunPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMaze = async () => {
      const response = await fetchMaze(mazeId);
      if (cancelled) return;
      if (response.ok) {
        setMaze(response.data.maze);
        changePhase("ready");
      } else {
        setErrorMessage(describeApiError(response.error));
        changePhase("error");
      }
    };
    void loadMaze();
    return () => {
      cancelled = true;
    };
  }, [mazeId, changePhase]);

  // The on-screen timer is only a display; the verified time is measured by the API
  useEffect(() => {
    if (phase !== "playing") return;
    const intervalId = window.setInterval(
      () => setElapsedMs(performance.now() - clientStartRef.current),
      TIMER_REFRESH_MS,
    );
    return () => window.clearInterval(intervalId);
  }, [phase]);

  const submitRun = useCallback(
    async (moves: Direction[]) => {
      const runToken = runTokenRef.current;
      if (runToken === null) return;

      changePhase("submitting");
      const response = await finishRunRequest({
        runToken,
        moves,
        nickname: nicknameToSendRef.current,
      });
      if (response.ok) {
        setResult(response.data);
        changePhase("finished");
        return;
      }
      setErrorMessage(describeApiError(response.error));
      changePhase("error");
    },
    [changePhase],
  );

  const handleStep = useCallback(
    (direction: Direction) => {
      if (maze === null || phaseRef.current !== "playing") return;

      const now = performance.now();
      if (now - lastStepAtRef.current < MIN_STEP_GAP_MS) return;

      const currentState = runStateRef.current;
      const nextState = applyStep(maze, currentState, direction);
      const moved = nextState.moves.length !== currentState.moves.length;

      if (!moved) {
        // A wall: nudge the character, but not on every held-key repeat
        if (now - feedbackRef.current.bumpAt > BUMP_COOLDOWN_MS) {
          feedbackRef.current = { bumpDirection: direction, bumpAt: now };
        }
        if (nextState !== currentState) {
          runStateRef.current = nextState;
          setRunState(nextState);
        }
        return;
      }

      lastStepAtRef.current = now;
      runStateRef.current = nextState;
      setRunState(nextState);
      if (hasReachedEnd(maze, nextState)) void submitRun(nextState.moves);
    },
    [maze, submitRun],
  );

  const { setTouchDirection, releaseTouchDirection } = useHeldDirection({
    enabled: phase === "playing",
    onStep: handleStep,
  });

  const resetRunState = useCallback(() => {
    const freshState = createInitialRunState();
    runStateRef.current = freshState;
    setRunState(freshState);
    runTokenRef.current = null;
    feedbackRef.current = NO_BUMP;
    setResult(null);
    setElapsedMs(0);
  }, []);

  // Starts a fresh run. The same path serves the first start, restart and play-again.
  const beginRun = useCallback(async () => {
    const currentPhase = phaseRef.current;
    const isBusy =
      currentPhase === "loading" || currentPhase === "starting" || currentPhase === "submitting";
    if (maze === null || isBusy) return;

    const nicknameResult = parseNickname(nickname);
    if (!nicknameResult.ok) {
      setErrorMessage(describeApiError("invalid-nickname"));
      return;
    }

    setErrorMessage(null);
    changePhase("starting");
    const response = await startRunRequest(mazeId);
    if (!response.ok) {
      setErrorMessage(describeApiError(response.error));
      changePhase(isStartPanelOpen ? "ready" : "error");
      return;
    }

    resetRunState();
    runTokenRef.current = response.data.runToken;
    nicknameToSendRef.current = nicknameResult.nickname;
    lastStepAtRef.current = 0;
    clientStartRef.current = performance.now();
    setIsStartPanelOpen(false);
    changePhase("playing");
  }, [maze, mazeId, nickname, isStartPanelOpen, changePhase, resetRunState]);

  const handleRetry = () => {
    if (maze === null) {
      window.location.reload(); // the maze itself never loaded
      return;
    }
    void beginRun();
  };

  // R restarts, but only mid-run or after a finish, and never while typing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      if (phaseRef.current !== "playing" && phaseRef.current !== "finished") return;
      event.preventDefault();
      void beginRun();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [beginRun]);

  const spec = parseId(mazeId);
  const description = spec === null ? "" : describeSpec(spec);
  const presentation = PHASE_PRESENTATION[phase];
  const displayedTimeMs = phase === "finished" && result !== null ? result.elapsedMs : elapsedMs;
  const showStartPanel = isStartPanelOpen && (phase === "ready" || phase === "starting");
  const showControls =
    phase === "playing" ||
    phase === "submitting" ||
    (phase === "starting" && !isStartPanelOpen);
  const canRestart = !isStartPanelOpen && (phase === "playing" || phase === "starting");
  const reachedEnd = maze !== null && hasReachedEnd(maze, runState);

  const boardLabel =
    maze === null
      ? ""
      : `Maze, ${maze.size} by ${maze.size} cells. Player at row ${runState.position.row + 1}, column ${runState.position.column + 1}.`;

  // Spoken by screen readers through the live region below
  const announcement = useMemo(() => {
    if (phase === "playing") return "Run started.";
    if (phase === "submitting") return "Verifying run.";
    if (phase === "finished" && result !== null) {
      return `Run verified. Time ${formatDuration(result.elapsedMs)}, ${result.moveCount} moves.`;
    }
    if (phase === "error" && errorMessage !== null) return errorMessage;
    return "";
  }, [phase, result, errorMessage]);

  return (
    <main className="play" data-start={showStartPanel}>
      <h1 className="sr-only">Maze {mazeId}</h1>
      <header className="play-bar">
        <Link href="/" className="wordmark">
          <Mark />
          Maze Runner
        </Link>
        {canRestart && (
          <button
            type="button"
            className="text-button"
            aria-keyshortcuts="R"
            onClick={() => void beginRun()}
          >
            Restart
            <span className="kbd" aria-hidden="true">
              R
            </span>
          </button>
        )}
      </header>

      <StatBar
        time={formatDuration(displayedTimeMs)}
        moves={runState.moves.length}
        state={presentation.label}
        stateTone={presentation.tone}
      />

      <div className="board-region">
        <div className="board" data-start={showStartPanel}>
          {maze !== null ? (
            <MazeCanvas
              maze={maze}
              position={runState.position}
              facing={runState.facing}
              trail={runState.trail}
              reachedEnd={reachedEnd}
              isRunning={phase === "playing"}
              feedbackRef={feedbackRef}
              label={boardLabel}
              onTouchDirection={setTouchDirection}
            />
          ) : (
            <div className="maze-frame" />
          )}

          {phase === "loading" && (
            <div className="board-overlay">
              <p className="label">Loading maze</p>
            </div>
          )}

          {showStartPanel && (
            <div className="board-overlay">
              <StartPanel
                mazeId={mazeId}
                description={description}
                nickname={nickname}
                onNicknameChange={setNickname}
                errorMessage={errorMessage}
                isStarting={phase === "starting"}
                challenge={challenge}
                onStart={() => void beginRun()}
              />
            </div>
          )}
        </div>
      </div>

      <div className="dock">
        {showControls && (
          <>
            <div className="coarse-only">
              <DirectionPad onPress={setTouchDirection} onRelease={releaseTouchDirection} />
            </div>
            <p className="hint fine-only">WASD or arrow keys to move · R to restart</p>
          </>
        )}
        {phase === "finished" && result !== null && (
          <ResultPanel result={result} challenge={challenge} onPlayAgain={() => void beginRun()} />
        )}
        {phase === "error" && (
          <ErrorPanel
            message={errorMessage ?? describeApiError("unknown-error")}
            onRetry={handleRetry}
          />
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </main>
  );
};

export default PlayClient;