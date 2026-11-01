export type StatTone = "default" | "signal" | "ok" | "danger";

type StatBarProps = {
  time: string;
  moves: number;
  state: string;
  stateTone: StatTone;
};

// Time and moves are the numbers that matter; the state word tells you what the game is doing
const StatBar = ({ time, moves, state, stateTone }: StatBarProps) => (
  <dl className="stats">
    <div className="stat stat-time">
      <dt className="label">Time</dt>
      <dd>{time}</dd>
    </div>
    <div className="stat">
      <dt className="label">Moves</dt>
      <dd>{moves}</dd>
    </div>
    <div className="stat stat-state">
      <dt className="label">State</dt>
      <dd data-tone={stateTone}>{state}</dd>
    </div>
  </dl>
);

export default StatBar;